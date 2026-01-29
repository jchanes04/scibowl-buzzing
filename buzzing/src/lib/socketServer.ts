// Socket.io Server Module
// This module exports functions to attach Socket.io to an existing HTTP server
// to allow running websockets on the same port as the web server

import { GameManager } from '$lib/classes/GameManager'
import { Server, Socket as IOSocket } from 'socket.io'
import type { Server as HTTPServer } from 'http'
import type { Server as HTTPSServer } from 'https'
import type Debugger from '$lib/classes/Debugger'
import type { Category, GameSettings, Question, ScoreType, ChatMessage } from '$lib/classes/Game'
import { Game } from '$lib/classes/Game'
import { getDataFromGameToken } from './authentication'
import { env } from "$env/dynamic/public"
import { getConvexClient, api } from './convex.server'
import { safeMutation, safeQuery } from './convex.result'
import fs from 'fs'

// Use a global variable to persist the socket.io server and game manager across HMR reloads in dev mode
const globalAny: any = global;

export const games: GameManager = globalAny._games || new GameManager()
if (!globalAny._games) {
    globalAny._games = games;
}

let io: Server | null = globalAny._io || null

export function getIO(): Server | null {
    return io
}

// Helper function to add a chat message and emit it via socket
function emitChatMessage(
    game: Game,
    message: Omit<ChatMessage, 'timestamp'>
) {
    if (!io) return

    const chatMessage = game.addChatMessage(message)

    if (message.target === undefined || message.target === null) {
        // Broadcast to entire game room (no target specified)
        io.to(game.id).emit('chatMessage', chatMessage)
    } else if (message.target.length > 0) {
        // Emit to specific members
        for (const memberId of message.target) {
            io.to(memberId).emit('chatMessage', chatMessage)
        }
    }
    // If target is an empty array, the message is stored but not emitted to anyone
}

export function attachSocketIO(httpServer: HTTPServer | HTTPSServer): Server {
    // If we already have an io instance attached to this server, return it
    if (globalAny._io) {
        return globalAny._io
    }

    io = new Server(httpServer, {
        cors: {
            origin: env.PUBLIC_HOST_URL,
            allowedHeaders: ["Cookie"],
            credentials: true
        },
        allowRequest: async (req, callback) => {
            const gameToken = req.headers.cookie?.split("; ").find(x => x.split("=")[0] === "gameToken")?.split("=")[1]
            const tokenResult = await getDataFromGameToken(gameToken || "")
            if (!gameToken || tokenResult.isErr()) {
                return callback(null, false)
            }

            const { memberId, gameId, spectator } = tokenResult.value
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

    globalAny._io = io

    setupSocketListeners(io)
    setupGameSweeper(io)

    return io
}

function setupSocketListeners(io: Server) {
    if (globalAny._io_listeners_attached) return
    globalAny._io_listeners_attached = true

    io.on('connection', async socket => {
        console.log("Socket connected")
        const cookie = socket.request.headers.cookie
        const spectatorParam = socket.handshake.query.spectator === "true"
        const gameToken = cookie?.split("; ").find(x => x.split("=")[0] === "gameToken")?.split("=")[1]
        const tokenResult = await getDataFromGameToken(gameToken || "")
        if (!gameToken || tokenResult.isErr()) {
            socket.emit('authFailed')
            return socket.disconnect()
        }

        const { gameId, memberId, spectator } = tokenResult.value
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

        // Handle chat message requests from clients
        socket.on('addChatMessage', async (data: { text: string; type: 'buzz' | 'notification' | 'warning' | 'success' }) => {
            if (spectator) return

            const currentGame = await getGame(gameId)
            if (!currentGame) return

            emitChatMessage(currentGame, {
                text: data.text,
                type: data.type
            })
        })

        socket.on('disconnect', async () => {
            // Spectators don't need tracking - just disconnect
            if (spectator) return

            const currentGame = await getGame(gameId)
            const member = currentGame?.getMember(memberId)
            if (member) {
                await getConvexClient().mutation(api.gameMembers.leave, {
                    gameId,
                    memberId
                })
            }

            // Check if the room is now empty (no more connected sockets)
            // Use setTimeout to allow the socket to fully leave the room
            setTimeout(async () => {
                const room = io.sockets.adapter.rooms.get(gameId)
                const roomSize = room?.size ?? 0

                if (roomSize === 0 && games.has(gameId)) {
                    // No members left, remove game from memory
                    await getConvexClient().mutation(api.games.setActive, {
                        gameId,
                        isActive: false
                    })
                    games.deleteGame(gameId)
                    console.log(`Game ${gameId} removed from memory - all members left`)
                }
            }, 100)
        })

        socket.on('reopenGame', async () => {
            if (spectator) return

            if (games.has(gameId)) return  // Already active

            const reopenedGame = await games.reopenGame(gameId)
            if (reopenedGame) {
                const member = reopenedGame.getMember(memberId)
                if (member) {
                    emitChatMessage(reopenedGame, {
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

            // Check if player is subbed
            if (player.isSubbed) {
                socket.emit('buzzFailed')
                emitChatMessage(currentGame, {
                    text: "You are currently subbed out",
                    type: "warning",
                    target: [memberId]
                })
                return
            }

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
                    emitChatMessage(currentGame, {
                        text: "You have buzzed",
                        type: "buzz",
                        target: [memberId]
                    })

                    // Add chat message for others (all members except buzzer)
                    const otherMembers = Object.keys(currentGame.people).filter(id => id !== memberId)
                    if (otherMembers.length > 0) {
                        emitChatMessage(currentGame, {
                            text: `${player.name} has buzzed`,
                            type: "buzz",
                            target: otherMembers
                        })
                    }
                } else {
                    socket.emit('buzzFailed')

                    // Add targeted warning for the player who was outbuzzed
                    emitChatMessage(currentGame, {
                        text: "You have been outbuzzed",
                        type: "warning",
                        target: [memberId]
                    })
                }
            } else {
                socket.emit('buzzFailed')

                emitChatMessage(currentGame, {
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
                emitChatMessage(currentGame, {
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

            // Mark game as completed (game has ended)
            await getConvexClient().mutation(api.games.setCompleted, {
                gameId,
                isCompleted: true
            })

            // Check if this is a tournament game and handle bracket advancement
            const gameDataResult = await safeQuery(getConvexClient(), api.games.getByGameId, { gameId })
            const gameData = gameDataResult.isOk() ? gameDataResult.value : null
            if (gameData?.tournamentId && gameData.tournamentMatchIndex !== undefined) {
                // Calculate team scores
                const scores = gameData.scores || {}
                const pointValues = gameData.pointValues || { tossup: 4, bonus: 10, penalty: -4 }
                const teamScores: Record<string, number> = {}

                for (const qNum of Object.keys(scores)) {
                    const questionRow = scores[qNum]
                    if (!questionRow) continue

                    // Process tossup scores
                    for (const teamId of Object.keys(questionRow.tossup || {})) {
                        const tossupData = questionRow.tossup[teamId]
                        if (!teamScores[teamId]) teamScores[teamId] = 0

                        if (tossupData.scoreType === 'correct') {
                            teamScores[teamId] += pointValues.tossup
                        } else if (tossupData.scoreType === 'penalty') {
                            teamScores[teamId] += pointValues.penalty
                        }
                        // incorrect and subbed don't add points
                    }

                    // Process bonus
                    if (questionRow.bonus?.teamId) {
                        const bonusTeamId = questionRow.bonus.teamId
                        if (!teamScores[bonusTeamId]) teamScores[bonusTeamId] = 0
                        if (questionRow.bonus.correct) {
                            teamScores[bonusTeamId] += pointValues.bonus
                        }
                    }
                }

                // Determine winner
                const teamIds = Object.keys(teamScores)
                console.log(`Tournament ${gameData.tournamentId} match ${gameData.tournamentMatchIndex}: Final scores`, teamScores)

                if (teamIds.length >= 2) {
                    const sortedTeams = teamIds.sort((a, b) => teamScores[b]! - teamScores[a]!)
                    const topTeamId = sortedTeams[0]!
                    const secondTeamId = sortedTeams[1]!
                    const topScore = teamScores[topTeamId]!
                    const secondScore = teamScores[secondTeamId]!

                    // Only advance if there's a clear winner (no tie)
                    if (topScore > secondScore) {
                        const advanceResult = await safeMutation(getConvexClient(), api.tournaments.advanceWinner, {
                            tournamentId: gameData.tournamentId,
                            matchIndex: gameData.tournamentMatchIndex,
                            bracket: gameData.tournamentMatchBracket,
                            winningTeamId: topTeamId,
                        })
                        if (advanceResult.isErr()) {
                            console.error('Failed to advance tournament winner:', advanceResult.error.message)
                            socket.emit('error', { message: 'Failed to advance tournament winner' })
                        } else {
                            console.log(`Tournament ${gameData.tournamentId}: Team ${topTeamId} (${topScore}) advanced from match ${gameData.tournamentMatchIndex} (${gameData.tournamentMatchBracket || 'single'}), defeating team ${secondTeamId} (${secondScore})`)
                        }
                    } else {
                        console.log(`Tournament ${gameData.tournamentId}: Tie (${topScore}-${secondScore}) in match ${gameData.tournamentMatchIndex}, manual resolution required`)
                    }
                } else if (teamIds.length === 1) {
                    // Only one team scored - they win by forfeit/walkover
                    const winnerId = teamIds[0]!
                    const advanceResult = await safeMutation(getConvexClient(), api.tournaments.advanceWinner, {
                        tournamentId: gameData.tournamentId,
                        matchIndex: gameData.tournamentMatchIndex,
                        bracket: gameData.tournamentMatchBracket,
                        winningTeamId: winnerId,
                    })
                    if (advanceResult.isErr()) {
                        console.error('Failed to advance tournament winner:', advanceResult.error.message)
                        socket.emit('error', { message: 'Failed to advance tournament winner' })
                    } else {
                        console.log(`Tournament ${gameData.tournamentId}: Team ${winnerId} advanced from match ${gameData.tournamentMatchIndex} (${gameData.tournamentMatchBracket || 'single'}) (only team with scores)`)
                    }
                } else {
                    console.log(`Tournament ${gameData.tournamentId}: No teams scored in match ${gameData.tournamentMatchIndex}, manual resolution required`)
                }
            }

            socket.to(gameId).emit('gameEnd')
            socket.emit('gameEnd')
            game.timer.end()
            game.gameClock.end()

            // Mark game as inactive (no longer in memory)
            await getConvexClient().mutation(api.games.setActive, {
                gameId,
                isActive: false
            })

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

        socket.on('setPlayerSub', async (targetPlayerId: string, isSubbed: boolean) => {
            if (spectator) return

            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return

            // Convex mutation is done in MemberListElement.svelte
            // Emit socket event for instant UI update
            io.to(gameId).emit('playerSubChanged', targetPlayerId, isSubbed)
        })

        socket.onAny(async () => {
            const currentGame = await getGame(gameId)
            if (currentGame) {
                currentGame.lastActive = Date.now()
            }
        })
    });
}

function setupGameSweeper(io: Server) {
    if (globalAny._io_interval_attached) return
    globalAny._io_interval_attached = true

    setInterval(async () => {
        const swept = await games.sweepGames()

        for (const id of swept) {
            io.to(id).emit('gameSwept')
        }
    }, 300_000)
}

export async function createNewGame(ownerName: string,
    gameData: {
        name: string, settings: GameSettings,
        teamNames: string[],
        times?: {
            tossup: [number, number],
            bonus: [number, number], visual: [number, number]
        },
        pointValues?: { tossup: number, bonus: number, penalty: number },
        ownerId?: string,
        tags?: string[]
    }) {
    console.log(gameData.ownerId, "gameData.ownerId")
    const { game, ownerId, teamIds } = games.createGame({ ...gameData, ownerName, ownerId: gameData.ownerId })
    console.log(ownerId, "ownerId")
    const convex = getConvexClient()

    // Create game in Convex with config and empty scoreboard
    const createResult = await safeMutation(convex, api.games.create, {
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
    if (createResult.isErr()) {
        throw new Error(`Failed to create game: ${createResult.error.message}`)
    }

    // Add owner as moderator to Convex
    const addOwnerResult = await safeMutation(convex, api.gameMembers.add, {
        gameId: game.id,
        memberId: ownerId,
        name: ownerName,
        type: "moderator"
    })
    if (addOwnerResult.isErr()) {
        throw new Error(`Failed to add owner: ${addOwnerResult.error.message}`)
    }

    // Add teams to Convex
    await Promise.all(
        gameData.teamNames.map(async (teamName, index) => {
            const teamId = teamIds[index];
            if (!teamId) return;
            const result = await safeMutation(convex, api.teams.add, {
                gameId: game.id,
                teamId,
                name: teamName,
                type: "default"
            });
            if (result.isErr()) {
                console.error(`Failed to add team ${teamName}:`, result.error.message)
            }
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

// Auto-initialize: If running in production mode with server.js,
// the HTTP server will be available in globalThis.__httpServer
// Attach Socket.io to it automatically
const globalThisAny = globalThis as any
if (globalThisAny.__httpServer && !globalAny._io) {
    console.log('🔌 Auto-attaching Socket.io to production HTTP server...')
    attachSocketIO(globalThisAny.__httpServer)
    console.log('✅ Socket.io ready on same port as web server')
}
