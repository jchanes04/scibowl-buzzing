import { GameManager } from './classes/GameManager'
import { Member } from './classes/Member'

export const games = new GameManager()

export function createNewGame(ownerData: { name: string }, gameData: { name: string, privateGame: boolean }) {
    let ownerMember = new Member(ownerData)
    let game = games.createGame({ ...gameData, ownerMember })
    return game
}