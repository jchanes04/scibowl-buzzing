import type { RequestEvent } from "@sveltejs/kit";
import { getGame } from "$lib/server";

export function get({ params, locals }: RequestEvent) {
    const { id } = params
    const game = getGame(id)
    
    const memberList = game.members.map(m => m.data)
    const teamList = game.teams.map(x => x.data)
    const moderatorList = game.moderators.map(m => m.data)
    return {
        body: JSON.stringify({
            gameInfo: {
                gameName: game.name,
                joinCode: game.joinCode,
                settings: game.settings,
                myMember: locals.memberData,
                myTeam: game.teams.find(t => t.id === locals.memberData.teamID)?.data ?? null
            },
            memberList,
            teamList,
            moderatorList
        })
    }
}