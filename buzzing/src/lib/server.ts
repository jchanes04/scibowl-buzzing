// HMR test
import { GameManager } from '$lib/classes/GameManager'

import * as https from 'https'
import { Server } from 'socket.io'

import fs from 'fs'
import type Debugger from '$lib/classes/Debugger'
import type { Category, Game, GameSettings, NewQuestionData, ScoreType } from '$lib/classes/Game'
import { getDataFromGameToken } from './authentication'
import { Moderator } from './classes/Moderator'
import { env } from "$env/dynamic/public"
import { addChatMessage, getConvexClient, api } from './convex.server'

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
        const game = games.get(gameId)
        if (!game) {
            return callback(null, false)
        }

        // Check if member exists in cache (for non-spectators)
        const member = game.getCachedMember(memberId)
        if (member && !spectator) {
            return callback(null, true)
        }

        // Check spectator permissions from Convex
        const gameData = await game.getGameData()
        if (gameData?.settings.spectatorsAllowed) {
            return callback(null, true)
        }

        return callback(null, false)
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
        const game = getGame(gameId)
        const member = game?.people[memberId]

        if (
            !game
            || spectator !== spectatorParam
            || (spectator && !game.settings.spectatorsAllowed)
            || (!spectator && !member)
        ) {
            socket.emit('authFailed')
            return socket.disconnect()
        }

        socket.join([gameId, memberId])

        if (!spectator && member) {
            socket.emit('authenticated', { name: member.name })
            if (game.gameClock.time > 0 && game.gameClock.live) {
                socket.emit('gameClockUpdate', game.gameClock.time)
            }
        }

        socket.on('disconnect', async () => {
            if (spectator) {
                game.removeSpectator(memberId)
            } else {
                const memberName = member?.name
                const removed = game.removeMember(memberId)
                if (removed !== null) {
                    // Update Convex (soft delete for rejoin capability)
                    await getConvexClient().mutation(api.gameMembers.leave, {
                        gameId,
                        memberId
                    })

                    socket.to(gameId).emit('memberLeave', memberId)

                    // Add chat message for member leaving
                    if (memberName) {
                        addChatMessage({
                            gameId,
                            text: `${memberName} has left the game`,
                            type: "notification"
                        })
                    }
                }
            }
        })

        socket.on('buzz', () => {
            if (spectator) return

            if (game.state.questionState === 'open' && (!game.state.currentQuestion.bonus || game.state.currentQuestion.team.players[memberId])) {
                const buzzed = game.buzz(memberId)
                if (buzzed) {
                    game.timer.pause()
                    socket.emit('buzzAccept')
                    socket.to(gameId).emit('buzz', memberId)

                    // Add chat message for the buzzer (targeted)
                    addChatMessage({
                        gameId,
                        text: "You have buzzed",
                        type: "buzz",
                        target: [memberId]
                    })

                    // Add chat message for others (broadcast)
                    const player = game.players[memberId]
                    if (player) {
                        addChatMessage({
                            gameId,
                            text: `${player.name} has buzzed`,
                            type: "buzz"
                        })
                    }
                } else {
                    socket.emit('buzzFailed')

                    // Add targeted warning for the player who was outbuzzed
                    addChatMessage({
                        gameId,
                        text: "You have been outbuzzed",
                        type: "warning",
                        target: [memberId]
                    })
                }
            } else {
                socket.emit('buzzFailed')

                addChatMessage({
                    gameId,
                    text: "You have been outbuzzed",
                    type: "warning",
                    target: [memberId]
                })
            }
        })

        socket.on('newQuestion', (question: NewQuestionData) => {
            if (member?.type !== "moderator") return

            game.newQuestion(question)
            socket.to(gameId).emit('questionOpen', question)
        })

        socket.on("openVisualBonus", (data: Buffer) => {
            if (member?.type !== "moderator") return

            socket.to(gameId).emit("visualBonusOpen", data)
        })

        socket.on('startTimer', () => {
            if (member?.type !== "moderator" || game.state.questionState !== "open") return

            const serverLength = game.state.currentQuestion.bonus ?
                game.state.currentQuestion.visual
                    ? game.times.visual[0] + game.times.visual[1]
                    : game.times.bonus[0] + game.times.bonus[1]
                : game.times.tossup[0] + game.times.tossup[1]
            game.timer.start(serverLength)

            const clientLength = game.state.currentQuestion.bonus
                ? game.state.currentQuestion.visual
                    ? game.times.visual[0]
                    : game.times.bonus[0]
                : game.times.tossup[0]
            socket.to(gameId).emit('timerStart', clientLength)
            socket.emit('timerStart', clientLength)

            game.timer.removeAllListeners('end')
            game.timer.once('end', () => {
                socket.to(gameId).emit('timerEnd')

                // Add chat message for timer end
                addChatMessage({
                    gameId,
                    text: "Time is up",
                    type: "warning"
                })
            })
        })

        socket.on('stopTimer', () => {
            if (member?.type !== "moderator") return

            game.timer.end()
            game.timer.removeAllListeners('end')
            socket.to(gameId).emit('timerEnd')
        })

        socket.on('scoreQuestion', (scoreType: 'correct' | 'incorrect' | 'penalty') => {
            if (member?.type !== "moderator") return
            if (game.state.questionState !== "buzzed" && !game.state.currentQuestion?.bonus) return

            const result = game.scoreQuestion(scoreType)

            if (!result) return

            const { buzzer, team, category, bonus, open, number } = result

            io.to(gameId).emit('scoreChange', {
                open,
                bonus,
                scoreType,
                playerId: buzzer?.id,
                teamId: team?.id,
                category,
                number
            })

            if (open) {
                const serverLength = game.state.currentQuestion.bonus
                    ? game.times.bonus[0] + game.times.bonus[1]
                    : game.times.tossup[0] + game.times.tossup[1]
                game.timer.start(serverLength)
            } else {
                game.timer.end()
            }
        })

        socket.on("markDead", () => {
            if (member?.type !== "moderator") return
            const result = game.markDead()
            game.timer.end()

            if (!result) return

            const { number, category } = result

            io.to(gameId).emit('deadQuestion', number, category)
        })

        socket.on("editTossup", (
            number: number,
            playerId: string,
            teamId: string,
            category: Category,
            scoreType: ScoreType | "none"
        ) => {
            // Scoreboard editing now handled by Convex - just broadcast the event
            socket.to(gameId).emit("tossupEdit",
                number,
                playerId,
                teamId,
                category,
                scoreType
            )
        })

        socket.on("editBonus", (
            number: number,
            teamId: string,
            scoreType: "correct" | "incorrect" | "none"
        ) => {
            // Scoreboard editing now handled by Convex - just broadcast the event
            socket.to(gameId).emit("bonusEdit",
                number,
                teamId,
                scoreType
            )
        })

        socket.on("deleteQuestion", (number: number) => {
            // Scoreboard deletion now handled by Convex - just broadcast the event
            socket.to(gameId).emit("questionDelete", number)
        })

        socket.on('kickPlayer', (id: string) => {
            if (member?.type !== "moderator") return

            const removed = game.kickPlayer(id)

            if (removed !== null) {
                socket.to(id).emit('kicked')
                io.in(id).disconnectSockets()
                io.to(gameId).emit('memberLeave', id)
            }
        })

        socket.on('promotePlayer', (id: string) => {
            if (member?.type !== "moderator") return

            const promoted = game.promotePlayer(id)

            if (promoted !== null) {
                io.to(gameId).emit('promotion', id)
            }
        })

        socket.on('renamePlayer', (id: string, name: string) => {
            if (member?.type !== "moderator") return

            const player = game.players[id]

            if (!player) return

            player.rename(name)

            io.to(gameId).emit("nameChange", id, name)
        })

        socket.on('clearScores', () => {
            if (member?.type !== "moderator") return

            // Scoreboard clearing now handled by Convex - just broadcast the event
            socket.to(gameId).emit('scoresClear')
            socket.emit('scoresClear')
        })

        socket.on('endGame', async () => {
            if (member?.type !== "moderator") return

            // Clean up Convex data
            const convex = getConvexClient()
            await Promise.all([
                convex.mutation(api.gameMembers.clearForGame, { gameId }),
                convex.mutation(api.teams.clearForGame, { gameId })
            ])

            socket.to(gameId).emit('gameEnd')
            socket.emit('gameEnd')
            game.timer.end()
            game.gameClock.end()
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
            if (member?.type !== "moderator") return

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
            if (member?.type !== "moderator") return

            if (game.gameClock.live) {
                game.gameClock.pause()
                io.to(gameId).emit('gameClockPause')
            } else {
                game.gameClock.resume()
                io.to(gameId).emit('gameClockResume')
            }
        })

        socket.on('stopGameClock', () => {
            if (member?.type !== "moderator") return

            game.gameClock.end()
            io.to(gameId).emit('gameClockStop')
        })

        socket.on('claimCaptain', () => {
            if (member?.type !== "player") return

            member.team.captainId = member.id
            io.to(gameId).emit('changeCaptain', member.team.id, member.id)
        })

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

export function createNewGame(ownerName: string, gameData: { name: string, settings: GameSettings, teamNames: string[] }) {
    const owner = new Moderator({ name: ownerName })
    const game = games.createGame({ ...gameData, owner })
    return game
}

export function getGame(id: string) {
    const game = games.get(id)
    return game
}

export function gameExists(id: string) {
    return games.has(id)
}

export function getGameFromCode(code: string): Game | null {
    return games.find(x => x.joinCode === code)
}