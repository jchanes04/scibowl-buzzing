import { GameManager } from '$lib/classes/GameManager'
import { Member } from '$lib/classes/Member'

import * as http from 'http'
import { Server } from 'socket.io'

const httpServer = http.createServer()
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000"
    }
})

io.on('connection', socket => {
    console.log("Socket connected")
    let { gameID, memberID } = socket.handshake.auth

    let game = getGame(gameID)
    if (game && game.members.some(x => x.id === memberID)) {
        socket.emit('authenticated')
    } else {
        socket.emit('authFailed')
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