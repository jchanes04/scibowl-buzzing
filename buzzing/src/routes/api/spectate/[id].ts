import type { EndpointOutput, RequestEvent } from "@sveltejs/kit";
import { games } from '$lib/server'
import { generateToken, getDataFromToken } from "$lib/authentication";

export async function get({ request, params }: RequestEvent): Promise<EndpointOutput> {
    const authToken = request.headers.get('Cookie')?.split("; ").find(x => x.split("=")[0] === "authToken")?.split("=")[1]
    const tokenData = await getDataFromToken(authToken)

    const { gameId, memberId, spectator } = tokenData || {}
    const game = games.get(params.id)

    if (!game) {
        return {
            status: 400
        }
    } else if (!authToken || params.id !== gameId || !spectator) {
        const game = games.get(params.id)
        const memberList = game.members.map(m => m.data)
        const teamList = game.teams.map(x => x.data)
        const moderatorList = game.moderators.map(m => m.data)

        if (!game.settings.spectatorsAllowed) {
            return {
                status: 400
            }
        }

        const id = game.addSpectator()
        const newToken = generateToken({ memberId: id, gameId: params.id, spectator: true })
        return {
            headers: {
                'Set-Cookie': "authToken=" + newToken + ";Path=/;Domain=" + (import.meta.env.VITE_HOST_URL as string).replace(/https?:\/\//, "").replace(/:[0-9]{1,4}/, "")
            },
            body: JSON.stringify({
                gameInfo: {
                    gameName: game.name,
                    settings: game.settings,
                    myMember: { id },
                    myTeam: null
                },
                memberList,
                teamList,
                moderatorList
            }),
            status: 200
        }
    } else {
        const game = games.get(params.id)
        const memberList = game.members.map(m => m.data)
        const teamList = game.teams.map(x => x.data)
        const moderatorList = game.moderators.map(m => m.data)

        return {
            body: JSON.stringify({
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
            }),
            status: 200
        }
    }
}