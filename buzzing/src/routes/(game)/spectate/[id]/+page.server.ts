import { generateGameToken } from "$lib/authentication"
import { getGame } from "$lib/server"
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { env } from "$env/dynamic/public"
import { getConvexClient, api } from "$lib/convex.server"

export const load = async function ({ params, cookies }) {
    const { id } = params
    const game = getGame(id)

    if (!game)
        redirect(302, "/join")

    // Get game data from Convex
    const convex = getConvexClient()
    const gameData = await convex.query(api.games.get, { gameId: id })

    if (!gameData)
        redirect(302, "/join")

    const gameToken = cookies.get('gameToken')
    if (!gameToken) {
        const newToken = generateGameToken({ gameId: id, spectator: true, memberId: "" })
        cookies.set("gameToken", newToken, {
            path: "/",
            domain: (new URL(env.PUBLIC_COOKIE_URL as string)).hostname
        })
    }

    const playerList = Object.fromEntries(
        Object.entries(game.players).map(([id, m]) => [id, m.data])
    )
    const teamList = Object.fromEntries(
        Object.entries(game.teams).map(([id, t]) => [id, t.data])
    )
    const moderatorList = Object.fromEntries(
        Object.entries(game.moderators).map(([id, m]) => [id, m.data])
    )

    return {
        gameInfo: {
            id,
            name: game.name,
            settings: gameData.settings,
            times: gameData.times
        },
        scores: gameData.scoreboard.scores,
        playerList,
        teamList,
        moderatorList
    }
} satisfies PageServerLoad
