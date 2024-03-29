import { Game, type GameSettings, type GameTimes } from './Game'
import { createJoinCode } from '$lib/functions/createId'
import { Team } from './Team'
import type { Moderator } from './Moderator'

// basically just a fancy array with methods and shit

export class GameManager {
    private games: Record<string, Game> = {}
    private joinCodes: string[] = []

    get(id: string) {
        return this.games[id] || null
    }

    has(id: string) {
        return (Object.hasOwn(this.games, id))
    }

    find(func: (game: Game) => boolean) {
        for (const game of Object.values(this.games)) {
            if (func(game)) {
                return game
            }
        }

        return null
    }

    createGame(options: { name: string, settings: GameSettings, teamNames: string[], owner: Moderator }) {
        const joinCode = createJoinCode()
        this.joinCodes.push(joinCode)
        const teams = options.teamNames.map(n => new Team(n))

        const game = new Game({ ...options, teams, joinCode })
        this.games[game.id] = game
        
        return game
    }

    deleteGame(id: string) {
        delete this.games[id]
    }

    sweepGames() {
        const swept: string[] = []

        for (const [ id, g ] of Object.entries(this.games)) {
            if (Date.now() - g.lastActive > 600_000) {
                swept.push(id)
                g.timer.end()
                this.deleteGame(id)
            }
        }

        return swept
    }
}