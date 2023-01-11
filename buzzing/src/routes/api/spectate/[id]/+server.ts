import type { RequestHandler } from "./$types";
import { games } from '$lib/server'
import { generateToken, getDataFromToken } from "$lib/authentication";

export const GET = async function({ params, cookies }) {
    const authToken = cookies.get('authToken')
    const tokenData = await getDataFromToken(authToken)

    const { gameId, memberId, spectator } = tokenData || {}
    const game = games.get(params.id)

    if (!game) {
        return new Response(undefined, { status: 400 })
    } else if (!authToken || params.id !== gameId || !spectator) {
        const game = games.get(params.id)
        const memberList = game.members.map(m => m.data)
        const teamList = game.teams.map(x => x.data)
        const moderatorList = game.moderators.map(m => m.data)

        if (!game.settings.spectatorsAllowed) {
            return new Response(undefined, { status: 400 })
        }

        const id = game.addSpectator()
        const newToken = generateToken({ memberId: id, gameId: params.id, spectator: true })
        cookies.set('authToken', newToken, {
            path: "/",
            domain: (import.meta.env.VITE_HOST_URL as string)
                .replace(/https?:\/\//, "").replace(/:[0-9]{1,4}/, "")
        })

        return new Response(JSON.stringify({
            gameInfo: {
                gameName: game.name,
                settings: game.settings,
                myMember: { id },
                myTeam: null
            },
            memberList,
            teamList,
            moderatorList
        }))
    } else {
        const game = games.get(params.id)
        const memberList = game.members.map(m => m.data)
        const teamList = game.teams.map(x => x.data)
        const moderatorList = game.moderators.map(m => m.data)

        return new Response(JSON.stringify({
            gameInfo: {
                gameName: game.name,
                joinCode: game.joinCode,
                settings: game.settings,
                myMember: { id: memberId },
                myTeam: null
            },
            memberList,
            teamList,
            moderatorList
        }))
    }
} satisfies RequestHandler