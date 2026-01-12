// HMR test
import { GameManager } from '$lib/classes/GameManager'

import * as https from 'https'
import { Server } from 'socket.io'

import fs from 'fs'
import type Debugger from '$lib/classes/Debugger'
import { createMemberID } from '$lib/functions/createId'
import type { Category, Game, GameSettings, NewQuestionData, ScoreType } from '$lib/classes/Game'
import { getDataFromGameToken } from './authentication'
import { env } from "$env/dynamic/public"
import { convex } from '$lib/convexClient'
import { api } from '../../convex/_generated/api'

const httpsServer = https.createServer({
    key: fs.readFileSync('localhost-key.pem').toString(),
    cert: fs.readFileSync('localhost.pem').toString()
})

// Use a global variable to persist the socket.io server and game manager across HMR reloads in dev mode
const globalAny: any = global;

export const games: GameManager = globalAny._games || new GameManager()
if (!globalAny._games) {
    globalAny._games = games;
}

export const io: Server = globalAny._io || new Server(httpsServer, {
    cors: {
        origin: env.PUBLIC_HOST_URL,
        allowedHeaders: ["Cookie"],
        credentials: true
    },
    allowRequest: async (req, callback) => {
        const gameToken = req.headers.cookie?.split("; ").find(x => x.split("=")[0] === "gameToken")?.split("=")[1]
        const tokenData = await getDataFromGameToken(gameToken || "")
        if (!gameToken || !tokenData) {
            return callback(null, false)
        }

        const { memberId, gameId, spectator } = tokenData
        const game = await getGame(gameId)
        if (!game) {
            return callback(null, false)
        } else if (game.hasMember(memberId) && !spectator) {
            return callback(null, true)
        } else if (game.settings.spectatorsAllowed) {
            return callback(null, true)
        } else {
            return callback(null, false)
        }
    }
})

if (!globalAny._io) {
    globalAny._io = io;
    httpsServer.listen(3030);
}

if (!globalAny._io_listeners_attached) {
    globalAny._io_listeners_attached = true;
    io.on('connection', async socket => {
        console.log("Socket connected")
        const cookie = socket.request.headers.cookie
        const spectatorParam = socket.handshake.query.spectator === "true"
        const gameToken = cookie?.split("; ").find(x => x.split("=")[0] === "gameToken")?.split("=")[1]
        const tokenData = await getDataFromGameToken(gameToken || "")
        if (!gameToken || !tokenData) {
            socket.emit('authFailed')
            return socket.disconnect()
        }

        const { gameId, memberId, spectator } = tokenData
        const game = await getGame(gameId)

        if (
            !game
            || spectator !== spectatorParam
            || (spectator && !game.settings.spectatorsAllowed)
            || (!spectator && !game.hasMember(memberId))
        ) {
            socket.emit('authFailed')
            return socket.disconnect()
        }

        const isModerator = game.isModerator(memberId)

        socket.join([gameId, memberId])

        if (!spectator) {
            socket.emit('authenticated', { memberId })
            if (game.gameClock.time > 0 && game.gameClock.live) {
                socket.emit('gameClockUpdate', game.gameClock.time)
            }
        }

        socket.on('disconnect', () => {
            if (spectator) {
                // Spectators are transient, no need to track
                return
            }

            // Mark as disconnected in Convex (subscription will update local cache)
            if (game.isPlayer(memberId)) {
                convex.mutation(api.games.disconnectPlayer, {
                    gameId: gameId as any,
                    externalId: memberId
                }).catch(console.error)
            } else if (game.isModerator(memberId)) {
                convex.mutation(api.games.disconnectModerator, {
                    gameId: gameId as any,
                    externalId: memberId
                }).catch(console.error)
            }

            // Send notification to chat
            convex.mutation(api.chatMessages.send, {
                gameId: gameId as any,
                type: "notification",
                text: "A player has left the game"
            }).catch(console.error)

            // Note: Empty game cleanup is handled by periodic sweep
            // The subscription will update playerTeams/moderatorIds cache
        })

        socket.on('buzz', () => {
            if (spectator) return
            if (game.state.questionState !== 'open') {
                return socket.emit('buzzFailed')
            }

            // For bonus questions, only players on the bonus team can buzz
            if (game.state.currentQuestion?.bonus) {
                const playerTeam = game.playerTeams.get(memberId)
                if (playerTeam !== game.state.currentQuestion.teamId) {
                    return socket.emit('buzzFailed')
                }
            }

            const buzzed = game.buzz(memberId)
            if (buzzed) {
                game.timer.pause()
                socket.emit('buzzAccept')
                socket.to(gameId).emit('buzz', memberId)
            } else {
                socket.emit('buzzFailed')
            }
        })

        socket.on('newQuestion', (question: NewQuestionData) => {
            if (!isModerator) return

            game.newQuestion(question)
            socket.to(gameId).emit('questionOpen', question)
        })

        socket.on("openVisualBonus", (data: Buffer) => {
            if (!isModerator) return

            socket.to(gameId).emit("visualBonusOpen", data)
        })

        socket.on('startTimer', () => {
            if (!isModerator || game.state.questionState !== "open") return

            const currentQuestion = game.state.currentQuestion
            if (!currentQuestion) return

            const serverLength = currentQuestion.bonus ?
                currentQuestion.visual
                    ? game.times.visual[0] + game.times.visual[1]
                    : game.times.bonus[0] + game.times.bonus[1]
                : game.times.tossup[0] + game.times.tossup[1]
            game.timer.start(serverLength)

            const clientLength = currentQuestion.bonus
                ? currentQuestion.visual
                    ? game.times.visual[0]
                    : game.times.bonus[0]
                : game.times.tossup[0]
            socket.to(gameId).emit('timerStart', clientLength)
            socket.emit('timerStart', clientLength)

            game.timer.removeAllListeners('end')
            game.timer.once('end', () => {
                convex.mutation(api.chatMessages.send, {
                    gameId: gameId as any,
                    type: "warning",
                    text: "Time is up"
                }).catch(console.error)
                socket.to(gameId).emit('timerEnd')
            })
        })

        socket.on('stopTimer', () => {
            if (!isModerator) return

            game.timer.end()
            game.timer.removeAllListeners('end')
            socket.to(gameId).emit('timerEnd')
        })

        socket.on('scoreQuestion', (scoreType: 'correct' | 'incorrect' | 'penalty') => {
            if (!isModerator) return
            if (game.state.questionState !== "buzzed" && !game.state.currentQuestion?.bonus) return

            const result = game.scoreQuestion(scoreType)

            if (!result) return

            const { buzzer, teamId, category, bonus, open, number } = result

            io.to(gameId).emit('scoreChange', {
                open,
                bonus,
                scoreType,
                playerId: buzzer?.id,
                teamId,
                category,
                number
            })

            if (open && game.state.currentQuestion) {
                const serverLength = game.state.currentQuestion.bonus
                    ? game.times.bonus[0] + game.times.bonus[1]
                    : game.times.tossup[0] + game.times.tossup[1]
                game.timer.start(serverLength)
            } else {
                game.timer.end()
            }
        })

        socket.on("markDead", () => {
            if (!isModerator) return
            const result = game.markDead()
            game.timer.end()

            if (!result) return

            const { number, category } = result

            io.to(gameId).emit('deadQuestion', number, category)
        })

        // Note: kickPlayer, promotePlayer, renamePlayer, clearScores removed
        // Client now calls Convex directly for these operations

        socket.on('endGame', () => {
            if (!isModerator) return

            socket.to(gameId).emit('gameEnd')
            socket.emit('gameEnd')
            games.deleteGame(gameId)
            io.in(gameId).disconnectSockets(true)
        })

        socket.on('logDump', (data: Omit<Debugger, 'socket' | 'openWindow'>) => {
            try {
                console.log(`Dumping log data from game id ${data.gameId} and name ${data.gameName}`)
                const fileData = fs.readFileSync(process.cwd() + '/debugLogs.json').toString()
                const currentLogs = JSON.parse(fileData)
                fs.writeFileSync(process.cwd() + '/debugLogs.json', JSON.stringify([
                    ...currentLogs,
                    data
                ], null, '\t'))
            } catch (e) {

            }
        })

        socket.on("startGameClock", (length) => {
            if (!isModerator) return

            game.gameClock.start(length)
            game.gameClock.on("update", (time: number) => {
                if (time <= 0) {
                    io.to(gameId).emit("gameClockEnd")
                } if (time % 15 === 0) {
                    io.to(gameId).emit("gameClockUpdate", time)
                }
            })
            io.to(gameId).emit("gameClockStart", length)
        })

        socket.on('pauseGameClock', () => {
            if (!isModerator) return

            if (game.gameClock.live) {
                game.gameClock.pause()
                io.to(gameId).emit('gameClockPause')
            } else {
                game.gameClock.resume()
                io.to(gameId).emit('gameClockResume')
            }
        })

        socket.on('stopGameClock', () => {
            if (!isModerator) return

            game.gameClock.end()
            io.to(gameId).emit('gameClockStop')
        })

        // Note: claimCaptain removed - client now calls Convex directly

        socket.onAny(() => {
            game.lastActive = Date.now()
        })
    });
}

if (!globalAny._io_interval_attached) {
    globalAny._io_interval_attached = true;
    setInterval(() => {
        const swept = games.sweepGames()

        for (const id of swept) {
            io.to(id).emit('gameSwept')
        }
    }, 300_000)
}

export const createNewGame = async (
    ownerName: string,
    gameData: { name: string, settings: GameSettings, teamNames: string[] },
    userId: string
) => {
    const ownerId = userId || createMemberID()
    return await games.createGame({
        name: gameData.name,
        settings: gameData.settings,
        teamNames: gameData.teamNames,
        ownerName,
        ownerId
    })
}

export async function getGame(id: string) {
    let game = games.get(id)
    if (!game) {
        game = await games.loadGame(id)
    }
    return game
}

export function gameExists(id: string) {
    return games.has(id)
}

export async function getGameFromCode(code: string): Promise<Game | null> {
    let game = games.find(x => x.joinCode === code)
    if (!game) {
        const convexGame = await convex.query(api.games.getByJoinCode, { joinCode: code });
        if (convexGame) {
            game = await games.loadGame(convexGame._id)
        }
    }
    return game || null
}
