import { GameManager } from '$lib/classes/GameManager'
import { Member } from '$lib/classes/Member'

import * as https from 'https'
import { Server } from 'socket.io'

import fs from 'fs'
import type Debugger from '$lib/classes/Debugger'
import type { TeamSettings } from '$lib/classes/Game'
import { getDataFromToken } from './authentication'

const httpsServer = https.createServer({
    key: fs.readFileSync('localhost-key.pem').toString(),
    cert: fs.readFileSync('localhost.pem').toString()
})
export const io = new Server(httpsServer, {
    cors: {
        origin: '*'
    }
})

io.on('connection', async socket => {
    console.log("Socket connected")
    const { authToken } = socket.handshake.auth

    const tokenData = await getDataFromToken(authToken)
    if (!tokenData) {
        socket.emit('authFailed')
        return socket.disconnect()
    }
    
    const { gameId, memberId } = tokenData
    const game = getGame(gameId)
    if (!game.members.some(m=> m.id === memberId) && !game.moderators.some(m => m.id === memberId)) {
        socket.emit('authFailed')
        return socket.disconnect()
    }

    socket.join(gameId)

    socket.emit('authenticated', {
        moderator: game.moderators.some(m => m.id === memberId)
    })

    socket.on('disconnect', () => {
        const removed = game.removeMember(memberId)
        if (removed !== null) {
            socket.to(gameId).emit('memberLeave', memberId)
        }
    })

    socket.on('buzz', () => {
        console.log('buzz received')
        if (game.state.questionState === 'open') {
            const buzzed = game.buzz(memberId)
            if (buzzed) {
                game.timer.pause()
                socket.to(gameId).emit('buzz', memberId)
            } else {
                socket.emit('buzzFailed')
            }
        } else {
            
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

            game.timer.once('end', () => {
                socket.to(gameId).emit('timerEnd')
            })
        }
    })

    socket.on('scoreQuestion', (score: 'correct' | 'incorrect' | 'penalty') => {
        if (game.state.questionState === "buzzed") {
            const { scoredMember, scoredTeam, open } = game.scoreQ(score)
            
            socket.to(gameId).emit('scoreChange', {
                open,
                score, 
                memberId: scoredMember.id,
                memberScore: scoredMember.scoreboard.score,
                teamID: scoredTeam.id,
                teamScore: scoredTeam.scoreboard.score
            })
            socket.emit('scoreChange', {
                open,
                score,
                memberId: scoredMember.id,
                memberScore: scoredMember.scoreboard.score,
                teamID: scoredTeam.id,
                teamScore: scoredTeam.scoreboard.score
            })

            if (open) {
                game.timer.resume()
            } else {
                game.timer.end()
            }
        }
    })

    socket.on('clearScores', () => {
        game.clearScores()
        socket.to(gameId).emit('scoresClear')
        socket.emit('scoresClear')
    })

    socket.on('saveScores', async () => {
        console.log('saving scores')
        const filename = game.name
            .replace(/[^a-zA-Z0-9-_\(\)]/g, "")
            .replace(/\s/g, "_")
        const postfix: "" | number = ""

        const fullName = await findOpenFile(filename, postfix)
        console.log("filename: " + fullName)

        const data = {
            teams: {},
            members: {}
        }

        game.teams.forEach(t => {
            if (!t.individual) {
                data.teams[t.name] = {
                    score: t.scoreboard.score,
                    catScores: t.scoreboard.catScores
                }
            }
        })

        game.members.forEach(m => {
            data.members[m.name] = {
                score: m.scoreboard.score,
                catScores: m.scoreboard.catScores
            }
        })

        console.dir(data)

        fs.writeFileSync(process.cwd() + '/data/' + fullName + '.json', JSON.stringify(data, null, '\t'))

        socket.emit('scoresSaved')
    })

    socket.on('endGame', () => {
        socket.to(gameId).emit('gameEnd')
        socket.emit('gameEnd')
        game.timer.end()
        games.deleteGame(gameId)
    })

    socket.on('logDump', (data: Omit<Debugger, 'socket'>) => {
        console.log(`Dumping log data from game id ${data.gameId} and name ${data.gameName}`)
        const fileData = fs.readFileSync(process.cwd() + '/debugLogs.json').toString()
        const currentLogs = JSON.parse(fileData)
        fs.writeFileSync(process.cwd() + '/debugLogs.json', JSON.stringify([
            ...currentLogs,
            data
        ], null, '\t'))
    })
});

httpsServer.listen(3030)

export const games = new GameManager()

export function createNewGame(ownerName: string, gameData: { name: string, teamSettings: TeamSettings, teamNames: string[] }) {
    const ownerMember = new Member({ name: ownerName, moderator: true })
    const game = games.createGame({ ...gameData, ownerMember })
    return game
}

export function getGame(id: string) {
    const game = games.get(id)
    return game
}

export function checkAuthenticated(gameId: string, memberId: string) {
    const game = games.get(gameId)
    return game?.members.some(x => x.id === memberId) || game?.leftPlayers.some(x => x === memberId)
}

export function gameExists(id: string) {
    return games.has(id)
}

export function getGameFromCode(code: string) {
    return games.find(x => x.joinCode === code)
}

async function findOpenFile(filename: string, postfix: "" | number) {
    const p = new Promise((res, rej) => {
        try {
            fs.stat(process.cwd() + "/data/" + filename + postfix + '.json', (err) => {
                if (err === null) {
                    res(findOpenFile(filename, postfix === "" ? 1 : postfix + 1))
                } else {
                    res(filename + postfix)
                }
            })
        } catch (e) {
            res(filename + postfix)   
        }
    })
    return p
}