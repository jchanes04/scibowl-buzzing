import { getDataFromGameToken } from "$lib/authentication"
import { getGame } from "$lib/server"
import { convex } from "$lib/convexClient"
import { api } from "../../../../../convex/_generated/api"
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

export const load = async function ({ params, locals, cookies }) {
    const { id } = params
    const game = await getGame(id)
    if (!game) redirect(302, "/join")

    const gameToken = cookies.get("gameToken")
    const tokenData = gameToken ? await getDataFromGameToken(gameToken) : null

    const memberId = tokenData?.memberId || locals?.user?.id || null

    // Check if member has access to this game
    // If they have a valid token for this game, they were added when they joined
    // The subscription will confirm their existence
    if (!memberId || tokenData?.gameId !== id) {
        if (game.settings.spectatorsAllowed) {
            redirect(302, "/spectate/" + id)
        } else {
            redirect(302, "/join/" + id)
        }
    }

    // Mark the member as connected in Convex
    // The subscription will update the server's cache
    if (game.isPlayer(memberId)) {
        convex.mutation(api.games.addPlayer, {
            gameId: id as any,
            externalId: memberId,
            name: "", // Name will be fetched from existing record
            connected: true
        }).catch(console.error)
    } else if (game.isModerator(memberId)) {
        convex.mutation(api.games.addModerator, {
            gameId: id as any,
            externalId: memberId,
            name: "",
            connected: true
        }).catch(console.error)
    }
    // If member not found in cache yet, the subscription will load them
    // The socket connection handler will also verify membership

    // Send notification
    convex.mutation(api.chatMessages.send, {
        gameId: id as any,
        type: "notification",
        text: "A player has rejoined the game"
    }).catch(console.error)

    // Fetch scoreboard from Convex
    const gameData = await convex.query(api.games.getFullGame, { gameId: id as any })
    const scores = JSON.parse(gameData?.game?.scoreboard || "{}")

    return {
        gameInfo: {
            id,
            name: game.name,
            joinCode: game.joinCode,
            settings: game.settings,
            times: game.times
        },
        scores,
        myMemberId: memberId,
        currentGameState: game.currentGameState
    }
} satisfies PageServerLoad
