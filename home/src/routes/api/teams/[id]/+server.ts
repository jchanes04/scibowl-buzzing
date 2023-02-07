import { deleteTeam, getTeam, updateTeam, type Team } from "$lib/mongo";
import type { RequestHandler } from "./$types"

export const GET = async function({ params }) {
    const { id } = params
    if (!id) return new Response(null, {
        status: 404
    })

    const fetchedTeam = await getTeam(id)
    return new Response(JSON.stringify(fetchedTeam))
} satisfies RequestHandler

export const PATCH = async function({ request, params }) {
    const body: Team = await request.json()
    if (body._id !== params.id) {
        return new Response(null, {
            status: 400
        })
    } else {
        await updateTeam(body._id, {
            name: body.name,
            members: body.members
        })
        return new Response(null, {
            status: 204
        })
    }
} satisfies RequestHandler

export const DELETE = async function({ params }) {
    const { id } = params
    if (!id) return new Response(null, {
        status: 404
    })

    await deleteTeam(id)
    return new Response(null, {
        status: 204
    })
} satisfies RequestHandler