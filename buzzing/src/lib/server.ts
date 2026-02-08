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
import type { Team } from './types/members'
import { calculateTeamScore } from './functions/scoreboard'

// Use a global variable to persist the socket.io server and game manager across HMR reloads in dev mode
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalAny = global as Record<string, any>;

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

// Helper function to emit full member/team state to all clients in the game room
function emitMembersUpdate(game: Game) {
    if (!io) return

    io.to(game.id).emit('membersUpdate', {
        members: game.members,
        teams: game.teams
    })
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
            } else if (game.members[memberId] && !spectator) {
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
        const member = game?.members[memberId]

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
            // Mark member as active on connect
            game.setMemberActive(memberId, true)

            socket.emit('authenticated', { name: member.name })
            if (game.gameClock.time > 0 && game.gameClock.live) {
                socket.emit('gameClockUpdate', game.gameClock.time)
            }

            // Send current member/team state to all clients
            emitMembersUpdate(game)
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

            // Mark member as inactive and notify other clients
            const currentGameForDisconnect = await getGame(gameId)
            if (currentGameForDisconnect) {
                currentGameForDisconnect.setMemberActive(memberId, false)
                emitMembersUpdate(currentGameForDisconnect)
            }

            // Check if the room is now empty (no more connected sockets)
            // Use setTimeout to allow the socket to fully leave the room
            setTimeout(async () => {
                const room = io.sockets.adapter.rooms.get(gameId)
                const roomSize = room?.size ?? 0

                if (roomSize === 0 && games.has(gameId)) {
                    const currentGame = await getGame(gameId)
                    if (currentGame) {
                        // Persist member state before removing from memory
                        try {
                            await getConvexClient().mutation(api.games.persistMemberState, {
                                gameId,
                                members: currentGame.members,
                                teams: currentGame.teams,
                            })
                        } catch (e) {
                            console.error(`Failed to persist member state for game ${gameId}:`, e)
                        }
                    }

                    // Mark inactive and remove from memory
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
                    const otherMembers = Object.keys(currentGame.members).filter(id => id !== memberId)
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

            let questionType = question.bonus ? (question.visual ? "visual" : "bonus") : "tossup"
            
            emitChatMessage(currentGame, {
                type: "notification",
                text: `${(questionType[0] || "").toUpperCase() + questionType.slice(1)} #${question.number} Opened`,
                target: Object.keys(currentGame.players)
            })

            emitChatMessage(currentGame, {
                type: "notification",
                text: `${(questionType[0] || "").toUpperCase() + questionType.slice(1)} #${question.number} Opened - ${(question.category[0] || "").toUpperCase() + question.category.slice(1)}`,
                target: Object.keys(currentGame.moderators)
            })

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

            // Snapshot game state before scoring (for rollback on Convex failure)
            const stateSnapshot = JSON.parse(JSON.stringify({
                questionState: currentGame.state.questionState,
                currentBuzzer: currentGame.state.currentBuzzer,
                currentQuestion: currentGame.state.currentQuestion,
                buzzedTeamIds: currentGame.state.buzzedTeamIds
            }))

            const result = currentGame.scoreQuestion(scoreType)

            if (!result) return

            const { buzzer, teamId, category, bonus, open, number } = result
            const membersSnapshot = currentGame.members
            const teamsSnapshot = currentGame.teams

            const categoryDisplay = category
                ? (category[0] || "").toUpperCase() + category.slice(1)
                : "";

            let messageText = "";
            let messageType: "success" | "warning" = "warning";

            // Call the appropriate Convex scoring mutation
            let convexResult
            if (scoreType === 'correct') {
                if (!bonus) {
                    if (!buzzer) return
                    convexResult = await safeMutation(getConvexClient(), api.games.correctTossup, {
                        gameId, number, playerId: buzzer.id, teamId, category,
                        members: membersSnapshot, teams: teamsSnapshot,
                    })
                } else {
                    convexResult = await safeMutation(getConvexClient(), api.games.correctBonus, {
                        gameId, number, teamId, category,
                        members: membersSnapshot, teams: teamsSnapshot,
                    })
                }

                messageText = `Correct answer${categoryDisplay ? ` (${categoryDisplay})` : ""}`;
                messageType = "success";

            } else if (scoreType === 'incorrect') {
                if (!bonus) {
                    if (!buzzer) return
                    convexResult = await safeMutation(getConvexClient(), api.games.incorrectTossup, {
                        gameId, number, playerId: buzzer.id, teamId, category,
                        members: membersSnapshot, teams: teamsSnapshot,
                    })
                } else {
                    convexResult = await safeMutation(getConvexClient(), api.games.incorrectBonus, {
                        gameId, number, teamId, category,
                        members: membersSnapshot, teams: teamsSnapshot,
                    })
                }

                messageText = "Incorrect answer";

            } else if (scoreType === 'penalty') {
                if (!buzzer) return
                convexResult = await safeMutation(getConvexClient(), api.games.penalty, {
                    gameId, number, playerId: buzzer.id, teamId, category,
                    members: membersSnapshot, teams: teamsSnapshot,
                })

                messageText = "Penalty applied";
            }
            

            if (convexResult && convexResult.isErr()) {
                // Rollback game state
                currentGame.state = {
                    questionState: stateSnapshot.questionState,
                    currentBuzzer: stateSnapshot.currentBuzzer,
                    currentQuestion: stateSnapshot.currentQuestion,
                    buzzedTeamIds: stateSnapshot.buzzedTeamIds
                } as Game['state']
                socket.emit('error', { message: 'Failed to save score. Please try again.' })
                console.error('Convex scoring failed, rolled back:', convexResult.error.message)
                return
            }

            io.to(gameId).emit('scoreChange', {
                open,
                bonus,
                scoreType,
                playerId: buzzer?.id,
                teamId,
                category,
                number
            })

            emitChatMessage(currentGame, {
                type: messageType,
                text: messageText
            })

            if (open) {
                const serverLength = currentGame.state.currentQuestion.bonus
                    ? currentGame.times.bonus[0] + currentGame.times.bonus[1]
                    : currentGame.times.tossup[0] + currentGame.times.tossup[1]
                currentGame.timer.start(serverLength)
            } else {
                currentGame.timer.end()
                const nextIsBonus = !bonus && scoreType === 'correct'
                io.to(gameId).emit('nextQuestion', { bonus: nextIsBonus, ...(nextIsBonus ? { teamId } : {}) })
            }
        })

        socket.on("markDead", async () => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return

            // Snapshot game state before marking dead
            const stateSnapshot = JSON.parse(JSON.stringify({
                questionState: currentGame.state.questionState,
                currentBuzzer: currentGame.state.currentBuzzer,
                currentQuestion: currentGame.state.currentQuestion,
                buzzedTeamIds: currentGame.state.buzzedTeamIds
            }))

            const result = currentGame.markDead()
            currentGame.timer.end()

            if (!result) return

            const { number, category } = result
            const membersSnapshot = currentGame.members
            const teamsSnapshot = currentGame.teams

            const convexResult = await safeMutation(getConvexClient(), api.games.dead, {
                gameId, number, category,
                members: membersSnapshot, teams: teamsSnapshot,
            })

            if (convexResult.isErr()) {
                // Rollback game state
                currentGame.state = {
                    questionState: stateSnapshot.questionState,
                    currentBuzzer: stateSnapshot.currentBuzzer,
                    currentQuestion: stateSnapshot.currentQuestion,
                    buzzedTeamIds: stateSnapshot.buzzedTeamIds
                } as Game['state']
                socket.emit('error', { message: 'Failed to mark dead. Please try again.' })
                console.error('Convex dead mutation failed, rolled back:', convexResult.error.message)
                return
            }

            emitChatMessage(currentGame, {
                type: "notification",
                text: "Question marked dead",
            })
            io.to(gameId).emit('deadQuestion')
            io.to(gameId).emit('nextQuestion', { bonus: false })
        })

        socket.on('kickPlayer', async (id: string) => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return

            const targetMember = currentGame.getMember(id)
            if (targetMember) {
                currentGame.removeMember(id)
                emitMembersUpdate(currentGame)

                socket.to(id).emit('kicked')
                io.in(id).disconnectSockets()
            }

            emitChatMessage(currentGame, {
                text: `${currentMember.name} has been kicked`,
                type: "notification"
            })
        })

        socket.on('promotePlayer', async (id: string) => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return

            currentGame.promoteMember(id)
            emitMembersUpdate(currentGame)
            io.to(gameId).emit('promotion', id)
        })

        socket.on('renameMember', async (id: string, newName: string) => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return

            currentGame.renameMember(id, newName)
            emitMembersUpdate(currentGame)
        })

        socket.on('endGame', async () => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return

            // Persist final member state
            try {
                await getConvexClient().mutation(api.games.persistMemberState, {
                    gameId,
                    members: currentGame.members,
                    teams: currentGame.teams,
                })
            } catch (e) {
                console.error(`Failed to persist member state on game end:`, e)
            }

            // Mark game as completed (game has ended)
            await getConvexClient().mutation(api.games.setCompleted, {
                gameId,
                isCompleted: true
            })

            // Check if this is a tournament game and handle bracket advancement
            const gameDataResult = await safeQuery(getConvexClient(), api.games.getByGameId, { gameId })
            const gameData = gameDataResult.isOk() ? gameDataResult.value : null
            if (gameData?.tournamentId && gameData.tournamentMatchIndex !== undefined) {
                const teamIds = Object.keys(currentGame.teams)

                if (teamIds.length >= 2) {
                    const teamScores: Record<string, number> = {}
                    for (const team of teamIds) {
                        teamScores[team] = calculateTeamScore(
                            team, 
                            gameData.scores || {}, 
                            gameData.pointValues || { tossup: 4, bonus: 10, penalty: -4 }
                        )
                    }
    
                    console.log(`Tournament ${gameData.tournamentId} match ${gameData.tournamentMatchIndex}: Final scores`, teamScores)
    
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

            const minutes = Math.floor(length / 60);
            const seconds = length % 60;
            const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

            emitChatMessage(currentGame, {
                type: "notification",
                text: `${timeDisplay} game clock started`,
            })
        })

        socket.on('pauseGameClock', async () => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return

            emitChatMessage(currentGame, {
                type: "notification",
                text: currentGame.gameClock.live
                    ? "Game clock paused"
                    : "Game clock resumed",
            })

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

            emitChatMessage(currentGame, {
                type: "notification",
                text: "Game clock stopped"
            })
        })

        socket.on('claimCaptain', async () => {
            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "player" || !currentMember.teamId) return

            currentGame.setTeamCaptain(currentMember.teamId, memberId)
            emitMembersUpdate(currentGame)
            emitChatMessage(currentGame, {
                type: "notification",
                text: `${currentMember.name} is now captain of ${currentGame.teams[currentMember.teamId]}`
            })
            io.to(gameId).emit('changeCaptain', currentMember.teamId, memberId)
        })

        socket.on('setPlayerSub', async (targetPlayerId: string, isSubbed: boolean) => {
            if (spectator) return

            const currentGame = await getGame(gameId)
            if (!currentGame) return

            const currentMember = currentGame.getMember(memberId)
            if (currentMember?.type !== "moderator") return

            currentGame.setMemberSubbed(targetPlayerId, isSubbed)
            emitMembersUpdate(currentGame)

            emitChatMessage(currentGame, {
                type: "notification",
                text: isSubbed
                    ? `${currentMember.name} has been subbed out`
                    : `${currentMember.name} is now in play`,
            })
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

    // Add moderator to in-memory game
    game.addMember({
        id: ownerId,
        name: ownerName,
        type: "moderator",
        isActive: true
    })

    // Add teams to in-memory game
    gameData.teamNames.forEach((teamName, index) => {
        const teamId = teamIds[index]
        if (!teamId) return
        game.addTeam({
            id: teamId,
            name: teamName,
            type: "default"
        })
    })

    const convex = getConvexClient()

    // Create game in Convex with config, empty scoreboard, and initial members/teams
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
        members: game.members,
        teams: game.teams,
    })
    if (createResult.isErr()) {
        throw new Error(`Failed to create game: ${createResult.error.message}`)
    }

    // Track game join for the owner
    await safeMutation(convex, api.games.trackGameJoin, { gameId: game.id, memberId: ownerId })

    return { game, ownerId }
}

export async function getGame(id: string) {
    const game = await games.get(id)
    return game
}

export function getGameFromCode(code: string): Game | null {
    return games.find(x => x.joinCode === code)
}

// Auto-initialize: If running in production mode with server.js,
// the HTTP server will be available in globalThis.__httpServer
// Attach Socket.io to it automatically
const globalThisTyped = globalThis as Record<string, unknown>
if (globalThisTyped.__httpServer && !globalAny._io) {
    console.log('Auto-attaching Socket.io to production HTTP server...')
    attachSocketIO(globalThisTyped.__httpServer as HTTPServer)
    console.log('Socket.io ready on same port as web server')
}
