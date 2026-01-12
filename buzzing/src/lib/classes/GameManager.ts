import { Game, type GameSettings, type GameTimes } from './Game'
import { createJoinCode, createTeamID } from '$lib/functions/createId'
import { convex } from '$lib/convexClient'
import { api } from '../../../convex/_generated/api'

import { env } from '$env/dynamic/private'

type CreateGameOptions = {
    name: string
    settings: GameSettings
    teamNames: string[]
    ownerName: string
    ownerId: string
}

export class GameManager {
    private games: Record<string, Game> = {}

    get activeGameIds() {
        return Object.keys(this.games)
    }

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

    async createGame(options: CreateGameOptions) {
        const joinCode = createJoinCode()

        // Create team data for Convex (just names and IDs)
        const initialTeams = options.teamNames.map(name => ({
            id: createTeamID(),
            name,
            type: "default" as const
        }))

        let convexId;
        try {
            console.log("Attempting to create game in Convex with args:", JSON.stringify({
                joinCode,
                name: options.name,
                ownerId: options.ownerId,
                ownerName: options.ownerName,
                settings: options.settings,
                teams: initialTeams
            }, null, 2));

            convexId = await convex.mutation(api.games.create, {
                joinCode,
                name: options.name,
                ownerId: options.ownerId,
                ownerName: options.ownerName,
                settings: options.settings,
                times: {
                    tossup: [5, 2],
                    bonus: [20, 2],
                    visual: [30, 2]
                },
                scoreboard: "{}",
                teams: initialTeams
            })
        } catch (e: any) {
            console.error("Convex creation failed!");
            console.error("Error message:", e.message);
            console.error("Error data:", e.data);
            console.error("Full error:", JSON.stringify(e));
            throw e; // Re-throw to fail the request
        }

        // Create local Game object (just for question state and timers)
        const game = new Game({
            name: options.name,
            settings: options.settings,
            joinCode,
            times: {
                tossup: [5, 2],
                bonus: [20, 2],
                visual: [30, 2]
            },
            id: convexId
        })

        // Setup subscriptions to sync player/team/moderator data from Convex
        game.setupSubscriptions()

        this.games[game.id] = game

        return game
    }

    async loadGame(id: string) {
        if (this.games[id]) return this.games[id]

        try {
            const data = await convex.query(api.games.getFullGame, { gameId: id as any });
            if (!data) return null;

            const { game: gameDoc } = data;

            // Create local Game object (just for question state and timers)
            // Player/team/moderator data will be loaded via subscriptions
            const game = new Game({
                name: gameDoc.name,
                settings: gameDoc.settings as GameSettings,
                joinCode: gameDoc.joinCode,
                times: gameDoc.times as GameTimes,
                id: gameDoc._id
            });

            // Setup subscriptions to sync player/team/moderator data from Convex
            game.setupSubscriptions()

            this.games[game.id] = game;
            return game;
        } catch (e) {
            console.error("Failed to load game from Convex:", e);
            return null;
        }
    }

    deleteGame(id: string) {
        const game = this.games[id]
        if (game) {
            game.cleanup()  // Clean up subscriptions and timers
        }
        delete this.games[id]
    }

    sweepGames() {
        const swept: string[] = []

        if (env.DISABLE_GAME_SWEEPING === 'true') {
            return swept
        }

        for (const [id, g] of Object.entries(this.games)) {
            if (Date.now() - g.lastActive > 300_000) {
                swept.push(id)
                this.deleteGame(id)  // This calls cleanup()
            }
        }

        return swept
    }
}
