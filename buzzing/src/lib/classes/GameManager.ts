import { Game, type GameSettings, type GameTimes } from './Game'
import { createJoinCode } from '$lib/functions/createId'
import { Team } from './Team'
import type { Moderator } from './Moderator'

const defaultTimes = {
    tossup: [5, 2],
    bonus: [20, 2]
} satisfies GameTimes

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
        for (const id in this.games) {
            if (func(this.games[id])) {
                return this.games[id]
            }
        }

        return null
    }

    createGame(options: { name: string, settings: GameSettings, teamNames: string[], owner: Moderator }) {
        const joinCode = createJoinCode()
        this.joinCodes.push(joinCode)
        const teams = options.teamNames.map(n => new Team(n))

        const game = new Game({ ...options, teams, joinCode, times: defaultTimes })
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