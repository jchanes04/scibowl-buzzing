import { Game, type GameSettings, type GameTimes } from './Game'
import { createJoinCode } from '$lib/functions/createId'
import { Team } from './Team'
import type { Moderator } from './Moderator'
import { getConvexClient, getConvexRealtimeClient, api } from '$lib/convex.server'

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

    async createGame(options: {
        name: string,
        settings: GameSettings,
        teamNames: string[],
        owner: Moderator,
        times?: GameTimes,
        pointValues?: { tossup: number, bonus: number, penalty: number }
    }) {
        const joinCode = createJoinCode()
        this.joinCodes.push(joinCode)

        // Create Game instance (lightweight, just manages state)
        const game = new Game({
            name: options.name,
            joinCode,
            convexClient: getConvexRealtimeClient()
        })

        // Store game in memory
        this.games[game.id] = game

        // Create game in Convex with all settings
        const convexClient = getConvexClient()
        await convexClient.mutation(api.games.createGame, {
            gameId: game.id,
            joinCode: game.joinCode,
            name: options.name,
            settings: options.settings,
            times: {
                tossup: options.times?.tossup || [5, 2],
                bonus: options.times?.bonus || [20, 2],
                visual: options.times?.visual || [30, 2]
            },
            pointValues: options.pointValues
        })

        // Create teams in Convex
        for (const teamName of options.teamNames) {
            const team = new Team(teamName)
            await convexClient.mutation(api.teams.create, {
                gameId: game.id,
                teamId: team.id,
                name: team.name,
                type: team.type
            })
        }

        // Create owner moderator in Convex
        await convexClient.mutation(api.gameMembers.create, {
            gameId: game.id,
            memberId: options.owner.id,
            name: options.owner.name,
            type: "moderator"
        })

        return game
    }

    deleteGame(id: string) {
        const game = this.games[id]
        if (game) {
            game.cleanup() // Unsubscribe from Convex
        }
        delete this.games[id]
        // Note: Convex data persists for historical purposes
        // Could add a mutation to mark game as inactive if needed
    }

    async sweepGames() {
        const swept: string[] = []

        if (process.env.DISABLE_GAME_SWEEPING === 'true') {
            return swept
        }

        const convexClient = getConvexClient()

        for (const [id, g] of Object.entries(this.games)) {
            if (Date.now() - g.lastActive > 600_000) {
                swept.push(id)
                // End any active timers in Convex
                await convexClient.mutation(api.games.endTimer, { gameId: id })
                await convexClient.mutation(api.games.endGameClock, { gameId: id })
                this.deleteGame(id)
            }
        }

        return swept
    }
}
