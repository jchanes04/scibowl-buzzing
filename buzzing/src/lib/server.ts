// HMR test
import { GameManager } from '$lib/classes/GameManager'

import * as https from 'https'
import { Server } from 'socket.io'

import fs from 'fs'
import type Debugger from '$lib/classes/Debugger'
import type { Category, Game, GameSettings,  Question,  ScoreType } from '$lib/classes/Game'
import { getDataFromGameToken } from './authentication'
import { env } from "$env/dynamic/public"
import { addChatMessage, getConvexClient, api } from './convex.server'
import { unsubscribeFromGame } from './server/gameMemberCache'

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
        } else if (game.people[memberId] && !spectator) {
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
            // Spectators don't need tracking - just disconnect
            if (spectator) return

            const currentGame = await getGame(gameId)
            const member = currentGame?.getMember(memberId)
            if (member) {
                // Soft delete in Convex (mark as inactive)
                await getConvexClient().mutation(api.gameMembers.leave, {
                    gameId,
                    memberId
                })
            }
        })

        socket.on('reopenGame', async () => {
            if (spectator) return

            if (games.has(gameId)) return  // Already active

            const reopenedGame = await games.reopenGame(gameId)
            if (reopenedGame) {
                const member = reopenedGame.getMember(memberId)
                if (member) {
                    addChatMessage({
                        gameId,
                        text: `${member.name} has reopened the game`,
                        type: "notification"
                    })
                }
            } else {
                socket.emit('gameSwept')
                socket.disconnect()
            }
        })

        socket.on('buzz', async () => {
            if (spectator) return

            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const player = currentGame.players[memberId]
            if (!player) return

            // Check if buzzing is allowed
            const isQuestionOpen = currentGame.state.questionState === 'open'
            const isBonus = currentGame.state.currentQuestion?.bonus
            const canBuzzBonus = isBonus && player.teamId === currentGame.state.currentQuestion?.teamId

            if (isQuestionOpen && (!isBonus || canBuzzBonus)) {
                const buzzed = currentGame.buzz(memberId)
                if (buzzed) {
                    currentGame.timer.pause()
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
                    addChatMessage({
                        gameId,
                        text: `${player.name} has buzzed`,
                        type: "buzz",
                        target: Object.keys(currentGame.players).filter(id => id !== memberId)
                    })
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

        socket.on('newQuestion', async (question: Question) => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return

            currentGame.newQuestion(question)
            socket.to(gameId).emit('questionOpen', question)
        })

        socket.on("openVisualBonus", async (data: Buffer) => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return

            socket.to(gameId).emit("visualBonusOpen", data)
        })

        socket.on('startTimer', async () => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator" || currentGame.state.questionState !== "open") return

            const serverLength = currentGame.state.currentQuestion.bonus ?
                currentGame.state.currentQuestion.visual
                    ? currentGame.times.visual[0] + currentGame.times.visual[1]
                    : currentGame.times.bonus[0] + currentGame.times.bonus[1]
                : currentGame.times.tossup[0] + currentGame.times.tossup[1]
            currentGame.timer.start(serverLength)

            const clientLength = currentGame.state.currentQuestion.bonus
                ? currentGame.state.currentQuestion.visual
                    ? currentGame.times.visual[0]
                    : currentGame.times.bonus[0]
                : currentGame.times.tossup[0]
            socket.to(gameId).emit('timerStart', clientLength)
            socket.emit('timerStart', clientLength)

            currentGame.timer.removeAllListeners('finished')
            currentGame.timer.once('finished', () => {
                socket.to(gameId).emit('timerEnd')

                // Add chat message for timer end
                addChatMessage({
                    gameId,
                    text: "Time is up",
                    type: "warning"
                })
            })
        })

        socket.on('stopTimer', async () => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return

            currentGame.timer.removeAllListeners('finished')
            currentGame.timer.end()
            socket.to(gameId).emit('timerStop')
        })

        socket.on('scoreQuestion', async (scoreType: 'correct' | 'incorrect' | 'penalty') => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return
            if (currentGame.state.questionState !== "buzzed" && !currentGame.state.currentQuestion?.bonus) return

            const result = currentGame.scoreQuestion(scoreType)

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

            if (open) {
                const serverLength = currentGame.state.currentQuestion.bonus
                    ? currentGame.times.bonus[0] + currentGame.times.bonus[1]
                    : currentGame.times.tossup[0] + currentGame.times.tossup[1]
                currentGame.timer.start(serverLength)
            } else {
                currentGame.timer.end()
            }
        })

        socket.on("markDead", async () => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return
            const result = currentGame.markDead()
            currentGame.timer.end()

            if (!result) return

            const { number, category } = result

            io.to(gameId).emit('deadQuestion', number, category)
        })

        socket.on('kickPlayer', async (id: string) => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return

            const targetMember = currentGame.getMember(id)
            if (targetMember) {
                // Hard delete in Convex (no rejoin allowed)
                await getConvexClient().mutation(api.gameMembers.kick, {
                    gameId,
                    memberId: id
                })

                socket.to(id).emit('kicked')
                io.in(id).disconnectSockets()
            }
        })

        socket.on('promotePlayer', async (id: string) => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return

            // Convex mutation is done in MemberListElement.svelte
            // Just emit the socket event for instant UI update
            io.to(gameId).emit('promotion', id)
        })

        socket.on('endGame', async () => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return

            // Mark game as inactive but preserve data for game history
            await getConvexClient().mutation(api.games.setActive, {
                gameId,
                isActive: false
            })

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

        socket.on("startGameClock", async (length) => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return

            currentGame.gameClock.start(length)
            game.gameClock.on("update", (time: number) => {
                if (time <= 0) {
                    io.to(gameId).emit("gameClockEnd")
                } if (time % 15 === 0) {
                    io.to(gameId).emit("gameClockUpdate", time)
                }
            })
            io.to(gameId).emit("gameClockStart", length)
        })

        socket.on('pauseGameClock', async () => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return

            if (currentGame.gameClock.live) {
                currentGame.gameClock.pause()
                io.to(gameId).emit('gameClockPause')
            } else {
                currentGame.gameClock.resume()
                io.to(gameId).emit('gameClockResume')
            }
        })

        socket.on('stopGameClock', async () => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return

            currentGame.gameClock.end()
            io.to(gameId).emit('gameClockStop')
        })

        socket.on('claimCaptain', async () => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "player" || !currentMember.teamId) return

            // Convex mutation is done in PlayerControls.svelte
            // Emit the socket event for buzz state update
            io.to(gameId).emit('changeCaptain', currentMember.teamId, memberId)
        })

        socket.onAny(async () => {
            const currentGame = await getGame(gameId)
            if (currentGame) {
                currentGame.lastActive = Date.now()
            }
        })
    });
}

if (!globalAny._io_interval_attached) {
    globalAny._io_interval_attached = true;
    setInterval(async () => {
        const swept = await games.sweepGames()

        for (const id of swept) {
            io.to(id).emit('gameSwept')
        }
    }, 100_000)
}

export async function createNewGame(ownerName: string,
    gameData: { name: string, settings: GameSettings,
        teamNames: string[],
        times?: { tossup: [number, number],
        bonus: [number, number], visual: [number, number] },
        pointValues?: { tossup: number, bonus: number, penalty: number },
        ownerId?: string,
        tags?: string[]
    }) {
    console.log(gameData.ownerId, "gameData.ownerId")
    const { game, ownerId, teamIds } = games.createGame({ ...gameData, ownerName, ownerId: gameData.ownerId })
    console.log(ownerId, "ownerId")
    // Create game in Convex with config and empty scoreboard
    await getConvexClient().mutation(api.games.create, {
        gameId: game.id,
        joinCode: game.joinCode,
        name: game.name,
        settings: game.settings,
        times: gameData.times ? {
            tossup: gameData.times.tossup,
            bonus: gameData.times.bonus,
            visual: gameData.times.visual,
        } : {
            tossup: game.times.tossup,
            bonus: game.times.bonus,
            visual: game.times.visual,
        },
        pointValues: gameData.pointValues || { tossup: 4, bonus: 10, penalty: -4 },
        tags: gameData.tags,
    })

    // Add owner as moderator to Convex
    await getConvexClient().mutation(api.gameMembers.add, {
        gameId: game.id,
        memberId: ownerId,
        name: ownerName,
        type: "moderator"
    })

    // Add teams to Convex
    await Promise.all(
        gameData.teamNames.map((teamName, index) => {
            const teamId = teamIds[index];
            if (!teamId) return Promise.resolve();
            return getConvexClient().mutation(api.teams.add, {
                gameId: game.id,
                teamId,
                name: teamName,
                type: "default"
            });
        })
    )

    return { game, ownerId }
}

export async function getGame(id: string) {
    const game = await games.get(id)
    return game
}

export function gameExists(id: string) {
    return games.has(id)
}

export function getGameFromCode(code: string): Game | null {
    return games.find(x => x.joinCode === code)
}