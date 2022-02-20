import type { RequestEvent } from "@sveltejs/kit";
import { getGame } from "$lib/server";

export function get({ params, locals }: RequestEvent) {
    const { id } = params
    const game = getGame(id)
    
    const memberList = game.members.map(m => m.data)
    const teamList = game.teams.map(x => x.data)

    return new Response(
        JSON.stringify({
            gameInfo: {
                gameName: game.name,
                joinCode: game.joinCode,
                teamSettings: game.teamSettings,
                myMember: locals.memberData,
                myTeam: game.teams.find(t => t.id === locals.memberData.teamID)?.data ?? null
            },
            memberList,
            teamList,
        })
    )
}