import { GameManager } from '$lib/classes/GameManager'
import { Member } from '$lib/classes/Member'

import * as http from 'http'
import { Server } from 'socket.io'

const httpServer = http.createServer()
export const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000"
    }
})

io.on('connection', socket => {
    console.log("Socket connected")
    const { gameID, memberID } = socket.handshake.auth

    let game = getGame(gameID)
    if (game && game.members.some(x => x.id === memberID)) {
        let member = game.members.find(x => x.id === memberID)
        socket.join(gameID)
        socket.emit('authenticated', {
            reader: memberID === game.owner.id
        })

        socket.on('disconnect', () => {
            let removed = game.removeMember(memberID)
            if (removed !== null) {
                socket.to(gameID).emit('memberLeave', memberID)
                game.addChatMessage({
                    text: removed.name + " has left",
                    type: 'notification'
                })
            }
        })

        socket.on('buzz', () => {
            console.log('buzz received')
            if (game.state === 'open') {
                let buzzed = game.buzz(memberID)
                game.addChatMessage({
                    text: buzzed.name + "buzzed",
                    type: 'buzz'
                })
                socket.to(gameID).emit('buzz', memberID)
            } else {
                
            }
        })
        
        socket.on('newQ',(question)=>{
            game.newQ(memberID,question)
            game.addChatMessage({
                text: "new question opened",
                type: 'notification'
            })
            socket.to(gameID).emit('questionOpen', question)
        })

    } else {
        socket.emit('authFailed')
        socket.disconnect()
    }
})

httpServer.listen(3030)

export const games = new GameManager()

export function createNewGame(ownerData: { name: string }, gameData: { name: string, privateGame: boolean }) {
    let ownerMember = new Member(ownerData)
    let game = games.createGame({ ...gameData, ownerMember })
    return game
}

export function getGame(id: string) {
    let game = games.get(id)
    return game
}

export function checkAuthenticated(gameID: string, memberID: string) {
    return games.has(gameID) && games.get(gameID).members.some(x => x.id === memberID)
}

export function gameExists(id: string) {
    return games.has(id)
}

export function getGameFromCode(code: string) {
    return games.find(x => x.joinCode === code)
}