import { addTeamToUser, createTeam, getTeam, Team } from "$lib/mongo";
import type { RequestEvent } from "@sveltejs/kit";

export async function GET({ locals }: RequestEvent) {
    return new Response(JSON.stringify(locals.userData.teamIds), {
        status: 200
    })
}

export async function POST({ request, locals }: RequestEvent) {
    const body: Omit<Team, 'createdAt' | 'id' | 'userId'> = await request.json()
    const createdTeam = await createTeam({
        ...body,
        userId: locals.userData.id
    })
    await addTeamToUser(locals.userData.id, createdTeam.id)
    return new Response(JSON.stringify(createdTeam), {
        status: 200
    })
}