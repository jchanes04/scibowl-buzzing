import type { RequestHandler } from "./$types";
import { getGame } from "$lib/server";

export const GET = async function({ params, locals }) {
    const { id } = params
    const game = getGame(id)
    
    const memberList = game.members.map(m => m.data)
    const teamList = game.teams.map(x => x.data)
    const moderatorList = game.moderators.map(m => m.data)
    return new Response(JSON.stringify({
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
    }))
} satisfies RequestHandler