import { generateGameToken } from "$lib/authentication"
import { getGame } from "$lib/server"
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { env } from "$env/dynamic/public"

export const load = async function ({ params, cookies }) {
    const { id } = params
    const game = getGame(id)

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

    // Build player list from cache
    const playerList = Object.fromEntries(
        Object.entries(game.players).map(([id, m]) => [id, {
            id: m.id,
            name: m.name,
            type: "player" as const,
            teamID: m.teamId
        }])
    )

    // Build team list from cache
    const teamList = Object.fromEntries(
        Object.entries(game.teams).map(([id, t]) => [id, {
            id: t.id,
            name: t.name,
            type: t.type,
            captainId: t.captainId ?? null
        }])
    )

    // Build moderator list from cache
    const moderatorList = Object.fromEntries(
        Object.entries(game.moderators).map(([id, m]) => [id, {
            id: m.id,
            name: m.name,
            type: "moderator" as const
        }])
    )

    return {
        gameInfo: {
            id,
            name: game.name,
            settings: game.settings,
            times: game.times
        },
        playerList,
        teamList,
        moderatorList
    }
} satisfies PageServerLoad
