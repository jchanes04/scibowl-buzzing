import { deleteTeam, getTeam, Team, updateTeam } from "$lib/mongo";
import type { RequestEvent } from "@sveltejs/kit";

export async function get({ params }: RequestEvent): Promise<Response> {
    const { id } = params
    const fetchedTeam = await getTeam(id)
    return new Response(JSON.stringify(fetchedTeam))
}

export async function patch({ request, params }: RequestEvent) {
    const body: Team = await request.json()
    if (body.id !== params.id) {
        return new Response(null, {
            status: 400
        })
    } else {
        await updateTeam(body.id, {
            teamName: body.teamName,
            members: body.members
        })
        return new Response(null, {
            status: 204
        })
    }
}

export async function del({ params }: RequestEvent) {
    await deleteTeam(params.id)
    return new Response(null, {
        status: 204
    })
}