import { Game } from './Game'
import type { Member } from './Member'
import { createJoinCode } from 'src/functions/createId'

export interface GameManager {

}

export class GameManager {
    constructor() {
        
    }

    private games: Record<string, Game> = {}
    private joinCodes: string[] = []

    get(id: string) {
        return this.games[id] || null
    }

    createGame(options: { name: string, ownerMember: Member }) {
        let joinCode = createJoinCode()
        this.joinCodes.push(joinCode)

        let game = new Game({ ...options, joinCode })
        this.games[game.id] = game
        
        return game
    }

    deleteGame(id: string) {
        
    }
}