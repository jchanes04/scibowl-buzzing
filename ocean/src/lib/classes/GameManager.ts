import { Game } from './Game'
import type { Member } from './Member'
import { createJoinCode } from '$lib/functions/createId'
import { Team } from './Team'

export interface GameManager {

}

// basically just a fancy array with methods and shit

export class GameManager {
    constructor() {
        
    }

    private games: Record<string, Game> = {}
    private joinCodes: string[] = []

    get(id: string) {
        return this.games[id] || null
    }

    has(id: string) {
        return (id in this.games)
    }

    find(func: (game: Game) => boolean) {
        for (let id in this.games) {
            if (func(this.games[id])) {
                return this.games[id]
            }
        }

        return null
    }

    createGame(options: { name: string, teamFormat: 'any' | 'individuals' | 'teams', teamNames: string[], ownerMember: Member }) {
        let joinCode = createJoinCode()
        this.joinCodes.push(joinCode)
        let teams = options.teamNames.map(n => new Team(n))

        let game = new Game({ ...options, teams, joinCode })
        this.games[game.id] = game
        
        return game
    }

    deleteGame(id: string) {
        delete this.games[id]
    }
}