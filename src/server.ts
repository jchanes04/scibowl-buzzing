import { GameManager } from '$lib/classes/GameManager'
import { Member } from '$lib/classes/Member'

import * as http from 'http'
import { Server } from 'socket.io'

const httpServer = http.createServer()
export const io = new Server(httpServer, {
    cors: {
        origin: '*'
    }
})

io.on('connection', socket => {
    console.log("Socket connected")
    const { gameID, memberID } = socket.handshake.auth

    let game = getGame(gameID)
    if (checkAuthenticated(gameID, memberID)) {
        socket.join(gameID)

        let member = game.members.find(x => x.id === memberID)
        socket.emit('authenticated', {
            reader: memberID === game.owner.id
        })

        socket.on('disconnect', () => {
            let removed = game.removeMember(memberID)
            if (removed !== null) {
                socket.to(gameID).emit('memberLeave', memberID)
                game.addChatMessage({
                    text: removed.name + " has left the game",
                    type: 'notification'
                })
            }

            if (removed.reader) {
                
            }
        })

        socket.on('buzz', () => {
            console.log('buzz received')
            if (game.state === 'open') {
                let buzzed = game.buzz(memberID)
                if (buzzed) {
                    game.timer.pause()
                    game.addChatMessage({
                        text: buzzed.name + "buzzed",
                        type: 'buzz'
                    })
                    socket.to(gameID).emit('buzz', memberID)
                } else {
                    socket.emit('buzzFailed')
                }
            } else {
                
            }
        })

        socket.on('newQ', (question)=>{
            game.newQ(memberID, question)
            game.addChatMessage({
                text: "new question opened",
                type: 'notification'
            })
            socket.to(gameID).emit('questionOpen', question)
        })

        socket.on('startTimer', () => {
            if (game.state === "open") {
                let serverLength = game.currentQuestion.bonus ? game.times.bonus[0] + game.times.bonus[1] : game.times.tossup[0] + game.times.tossup[1]
                game.timer.start(serverLength)


                let clientLength = game.currentQuestion.bonus ? game.times.bonus[0] : game.times.tossup[0]
                socket.to(gameID).emit('timerStart', clientLength)
                socket.emit('timerStart', clientLength)

                game.timer.once('end', () => {
                    socket.to(gameID).emit('timerEnd')
                })
            }
        })

        socket.on('scoreQuestion', (score: 'correct' | 'incorrect' | 'penalty') => {
            if (game.state === "buzzed") {
                let { scoredMember, scoredTeam, open } = game.scoreQ(score)
                
                socket.to(gameID).emit('scoreChange', {
                    open,
                    score, 
                    memberID: scoredMember.id,
                    memberScore: scoredMember.scoreboard.score,
                    teamID: scoredTeam.id,
                    teamScore: scoredTeam.scoreboard.score
                })
                socket.emit('scoreChange', {
                    open,
                    score,
                    memberID: scoredMember.id,
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

        socket.on('endGame', () => {
            socket.to(gameID).emit('gameEnd')
            game.timer.end()
            games.deleteGame(gameID)
        })
    } else {
        console.dir(socket.handshake.auth)
        socket.emit('authFailed')
    }
})

httpServer.listen(3030)

export const games = new GameManager()

export function createNewGame(ownerData: { name: string, reader: boolean }, gameData: { name: string, teamFormat: 'any' | 'individuals' | 'teams', teamNames: string[] }) {
    let ownerMember = new Member(ownerData)
    let game = games.createGame({ ...gameData, ownerMember })
    return game
}

export function getGame(id: string) {
    let game = games.get(id)
    return game
}

export function checkAuthenticated(gameID: string, memberID: string) {
    let game = games.get(gameID)
    return game?.members.some(x => x.id === memberID) || game?.leftPlayers.some(x => x.id === memberID)
}

export function gameExists(id: string) {
    return games.has(id)
}

export function getGameFromCode(code: string) {
    return games.find(x => x.joinCode === code)
}