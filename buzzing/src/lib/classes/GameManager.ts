import { Game, type GameSettings, type GameTimes } from './Game'
import { createJoinCode, createMemberID, createTeamID } from '$lib/functions/createId'
import { getConvexClient, api } from '$lib/convex.server'
// basically just a fancy array with methods and shit

export class GameManager {
    private games: Record<string, Game> = {}
    private joinCodes: string[] = []

    async get(id: string) {
        if (this.games[id]) {
            return this.games[id];
        }
        return await this.reopenGame(id);
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

    createGame(options: { name: string, settings: GameSettings, teamNames: string[], ownerName: string, ownerId?: string }): { game: Game, ownerId: string, teamIds: string[] } {
        const joinCode = createJoinCode()
        this.joinCodes.push(joinCode)

        const ownerId = options.ownerId || createMemberID()
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
        delete this.games[id]
    }

    async sweepGames() {
        const swept: string[] = []

        for (const [id, g] of Object.entries(this.games)) {
            if (Date.now() - g.lastActive > 300_000) {
                swept.push(id)
                g.timer.end()
                g.gameClock.end()

                // Persist member state before removing from memory
                try {
                    await getConvexClient().mutation(api.games.persistMemberState, {
                        gameId: id,
                        members: g.getMembersSnapshot(),
                        teams: g.getTeamsSnapshot(),
                    })
                } catch (e) {
                    console.error(`Failed to persist member state for game ${id}:`, e)
                }

                // Mark inactive, DON'T delete
                try {
                    await getConvexClient().mutation(api.games.setActive, {
                        gameId: id,
                        isActive: false
                    })
                } catch (e) {
                    console.error(`Failed to mark game ${id} inactive:`, e)
                }

                // Remove from memory
                delete this.games[id]
            }
        }

        return swept
    }

    async reopenGame(gameId: string): Promise<Game | null> {
        if (this.has(gameId)) return await this.get(gameId)

        const convex = getConvexClient()
        const gameData = await convex.query(api.games.getByGameId, { gameId })
        if (!gameData) return null

        const game = new Game({
            name: gameData.name,
            settings: gameData.settings,
            teamNames: [],
            ownerId: '',
            ownerName: '',
            joinCode: gameData.joinCode,
            times: {
                tossup: gameData.times.tossup as [number, number],
                bonus: gameData.times.bonus as [number, number],
                visual: gameData.times.visual as [number, number]
            },
            existingId: gameId  // Reuse the ID
        })

        // Restore member/team state from last-persisted Convex data
        game.restoreFromConvexData(gameData.members, gameData.teams)

        this.games[gameId] = game
        await convex.mutation(api.games.setActive, { gameId, isActive: true })
        return game
    }
}
