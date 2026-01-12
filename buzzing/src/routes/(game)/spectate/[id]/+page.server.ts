import { generateGameToken } from "$lib/authentication"
import { getGame } from "$lib/server"
import { convex } from "$lib/convexClient"
import { api } from "../../../../../convex/_generated/api"
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { env } from "$env/dynamic/public"

export const load = async function ({ params, cookies }) {
    const { id } = params
    const game = await getGame(id)

    if (!game)
        redirect(302, "/join")

    const gameToken = cookies.get('gameToken')
    if (!gameToken) {
        const newToken = generateGameToken({ gameId: id, spectator: true, memberId: "" })
        cookies.set("gameToken", newToken, {
            path: "/",
            domain: (new URL(env.PUBLIC_COOKIE_URL as string)).hostname
        })
    }

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
        scores
        // Note: playerList, teamList, moderatorList removed
        // Client gets these via Convex subscriptions
    }
} satisfies PageServerLoad
