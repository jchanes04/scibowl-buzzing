import { GameManager } from '$lib/classes/GameManager'
import { Member } from '$lib/classes/Member'

import * as https from 'https'
import { Server } from 'socket.io'

import fs from 'fs'
import type Debugger from '$lib/classes/Debugger'
import type { GameSettings } from '$lib/classes/Game'
import { getDataFromToken } from './authentication'
import { addGameScores } from './mongo'

const httpsServer = https.createServer({
    key: fs.readFileSync('localhost-key.pem').toString(),
    cert: fs.readFileSync('localhost.pem').toString()
})
export const io = new Server(httpsServer, {
    cors: {
        origin: import.meta.env.VITE_HOST_URL,
        allowedHeaders: ["Cookie"],
        credentials: true
    },
    allowRequest: async (req, callback) => {
        const authToken = req.headers.cookie?.split("; ").find(x => x.split("=")[0] === "authToken")?.split("=")[1]
        const tokenData = await getDataFromToken(authToken)
        if (!tokenData) {
            return callback(null, false)
        }

        const { memberId, gameId, spectator } = tokenData
        const game = games.get(gameId)
        if (!game) {
            return callback(null, false)
        } else if (game.people.some(x => x.id === memberId) && !spectator) {
            return callback(null, true)
        } else if (game.settings.spectatorsAllowed) {
            return callback(null, true)
        } else {
            return callback(null, false)
        }
    }
})

io.on('connection', async socket => {
    console.log("Socket connected")
    const cookie = socket.request.headers.cookie
    const authToken = cookie?.split("; ").find(x => x.split("=")[0] === "authToken")?.split("=")[1]
    const tokenData = await getDataFromToken(authToken)
    if (!tokenData) {
        socket.emit('authFailed')
        return socket.disconnect()
    }
    
    const { gameId, memberId, spectator } = tokenData
    const game = getGame(gameId)
    
    if (!game) {
        socket.emit('authFailed')
        return socket.disconnect()
    } else if (!game.people.some(m => m.id === memberId)) {
        if (game.leftPlayers.some(p => p.id === memberId)) {
            const rejoined = game.rejoinMember(memberId)
            if (rejoined) {
                socket.to(gameId).emit('memberRejoin', { member: rejoined.data, team: rejoined.team?.data })
            } else {
                socket.emit('authFailed')
                return socket.disconnect()
            }
        } else if (!game.settings.spectatorsAllowed || !spectator) {
            socket.emit('authFailed')
            return socket.disconnect()
        }
    }

    socket.join([gameId, memberId])

    if (!spectator) {
        socket.emit('authenticated', { name: game.people.find(x => x.id === memberId)?.name })
    }

    socket.on('disconnect', () => {
        if (!spectator) {
            const removed = game.removeMember(memberId)
            if (removed !== null) {
                socket.to(gameId).emit('memberLeave', memberId)
            }
        } else {
            game.removeSpectator(memberId)
        }
    })

    socket.on('buzz', () => {
        if (game.state.questionState === 'open') {
            const buzzed = game.buzz(memberId)
            if (buzzed) {
                game.timer.pause()
                socket.emit('buzzAccept')
                socket.to(gameId).emit('buzz', memberId)
            } else {
                socket.emit('buzzFailed')
            }
        } else {
            socket.emit('buzzFailed')
        }
    })

    socket.on('newQ', (question)=>{
        game.newQ(memberId, question)
        socket.to(gameId).emit('questionOpen', question)
    })

    socket.on('startTimer', () => {
        if (game.state.questionState === "open") {
            const serverLength = game.state.currentQuestion.bonus ? game.times.bonus[0] + game.times.bonus[1] : game.times.tossup[0] + game.times.tossup[1]
            game.timer.start(serverLength)

            const clientLength = game.state.currentQuestion.bonus ? game.times.bonus[0] : game.times.tossup[0]
            socket.to(gameId).emit('timerStart', clientLength)
            socket.emit('timerStart', clientLength)

            game.timer.removeAllListeners('end')
            game.timer.once('end', () => {
                socket.to(gameId).emit('timerEnd')
            })
        }
    })

    socket.on('scoreQuestion', (score: 'correct' | 'incorrect' | 'penalty') => {
        if (game.state.questionState === "buzzed") {
            const { scoredMember, scoredTeam, open, category } = game.scoreQ(score)
    
            socket.to(gameId).emit('scoreChange', {
                open,
                score, 
                memberId: scoredMember.id,
                memberScore: scoredMember.scoreboard.score,
                teamID: scoredTeam.id,
                teamScore: scoredTeam.scoreboard.score,
                category
            })
            socket.emit('scoreChange', {
                open,
                score,
                memberId: scoredMember.id,
                memberScore: scoredMember.scoreboard.score,
                teamID: scoredTeam.id,
                teamScore: scoredTeam.scoreboard.score,
                category
            })

            if (open) {
                const serverLength = game.state.currentQuestion.bonus ? game.times.bonus[0] + game.times.bonus[1] : game.times.tossup[0] + game.times.tossup[1]
                game.timer.start(serverLength)
            } else {
                game.timer.end()
            }
        }
    })

    socket.on('undoScore', () => {
        if (game.state.lastScored) {
            const undoData = game.undoScore()
            if (undoData) {
                const { score, scoredMember, scoredTeam, category, bonus } = undoData
                socket.emit('scoreUndone', {
                    score,
                    memberID: scoredMember.id,
                    memberScore: scoredMember.scoreboard.score,
                    teamID: scoredTeam.id,
                    teamScore: scoredTeam.scoreboard.score,
                    category,
                    bonus
                })
                socket.to(gameId).emit('scoreUndone', {
                    score,
                    memberID: scoredMember.id,
                    memberScore: scoredMember.scoreboard.score,
                    teamID: scoredTeam.id,
                    teamScore: scoredTeam.scoreboard.score,
                    category,
                    bonus
                })
            } else {
                socket.emit('undoScoreFailed')
            }
        } else {
            socket.emit('undoScoreFailed')
        }
    })

    socket.on('kickPlayer', (id: string) => {
        const removed = game.removeMember(id)
        
        if (removed !== null) {
            socket.to(id).emit('kicked')
            io.in(id).disconnectSockets()
            io.to(gameId).emit('memberLeave', id)
        }
    })

    socket.on('promotePlayer', (id: string) => {
        const promoted = game.promoteMember(id)

        if (promoted != null) {
            io.to(gameId).emit('promotion', id)
        }
    })

    socket.on('clearScores', () => {
        game.clearScores()
        socket.to(gameId).emit('scoresClear')
        socket.emit('scoresClear')
    })

    socket.on('saveScores', async () => {
        console.log('saving scores')
        await addGameScores(game.scores)
        socket.emit('scoresSaved')
    })

    socket.on('endGame', () => {
        socket.to(gameId).emit('gameEnd')
        socket.emit('gameEnd')
        game.timer.end()
        games.deleteGame(gameId)
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

    socket.onAny(() => {
        game.lastActive = Date.now()
    })
});

httpsServer.listen(3030)

export const games = new GameManager()

setInterval(sweepGames, 300_000)

export function createNewGame(ownerName: string, gameData: { name: string, settings: GameSettings, teamNames: string[] }) {
    const ownerMember = new Member({ name: ownerName, moderator: true })
    const game = games.createGame({ ...gameData, ownerMember })
    return game
}

export function getGame(id: string) {
    const game = games.get(id)
    return game
}

export function gameExists(id: string) {
    return games.has(id)
}

export function getGameFromCode(code: string) {
    return games.find(x => x.joinCode === code)
}


function sweepGames() {
    const swept = games.sweepGames()

    for (const id of swept) {
        io.to(id).emit('gameSwept')
    }
}