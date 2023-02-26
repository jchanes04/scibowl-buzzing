import { generateToken } from "$lib/authentication"
import { getGame } from "$lib/server"
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

export const load = async function({ params, cookies, isDataRequest }) {
    const { id } = params
    const game = getGame(id)

    if (!game)
        throw redirect(302, "/join")

    const authToken = cookies.get('authToken')
    if (!authToken) {
        const newToken = generateToken({ gameId: id, spectator: true, memberId: "" })
        cookies.set("authToken", newToken, {
            path: "/",
            domain: (import.meta.env.VITE_HOST_URL as string)
                .replace(/https?:\/\//, "").replace(/:[0-9]{1,4}/, "")
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
        playerList,
        teamList,
        moderatorList
    }
} satisfies PageServerLoad