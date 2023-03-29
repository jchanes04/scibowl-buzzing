import { generateToken } from "$lib/authentication"
import { getGame } from "$lib/server"
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { env } from "$env/dynamic/public"

export const load = async function({ params, cookies, isDataRequest }) {
    const { id } = params
    const game = getGame(id)

    if (!game)
        throw redirect(302, "/join")

    const gameToken = cookies.get('gameToken')
    if (!gameToken) {
        const newToken = generateToken({ gameId: id, spectator: true, memberId: "" })
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
            name: game.name,
            settings: game.settings,
            times: game.times
        },
        scores: game.scoreboard.scores,
        playerList,
        teamList,
        moderatorList
    }
} satisfies PageServerLoad
