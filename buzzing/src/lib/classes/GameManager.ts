import { Game, type GameSettings, type GameTimes } from './Game'
import { createJoinCode, createMemberID, createTeamID } from '$lib/functions/createId'
import { unsubscribeFromGame } from '$lib/server/gameMemberCache'

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

    createGame(options: { name: string, settings: GameSettings, teamNames: string[], ownerName: string }): { game: Game, ownerId: string, teamIds: string[] } {
        const joinCode = createJoinCode()
        this.joinCodes.push(joinCode)

        const ownerId = createMemberID()
        const teamIds = options.teamNames.map(() => createTeamID())

        const game = new Game({
            ...options,
            ownerId,
            ownerName: options.ownerName,
            joinCode
        })
        this.games[game.id] = game

        return { game, ownerId, teamIds }
    }

    deleteGame(id: string) {
        // Unsubscribe from Convex before deleting
        unsubscribeFromGame(id)
        delete this.games[id]
    }

    sweepGames() {
        const swept: string[] = []

        if (process.env.DISABLE_GAME_SWEEPING === 'true') {
            return swept
        }

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