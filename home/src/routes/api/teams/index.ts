import { addTeamToUser, createTeam, Team } from "$lib/mongo";
import type { RequestEvent } from "@sveltejs/kit";

export async function post({ request, locals }: RequestEvent) {
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