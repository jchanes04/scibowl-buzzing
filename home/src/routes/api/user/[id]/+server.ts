import { deleteUser } from "$lib/mongo"
import type { RequestHandler } from "./$types"

export const DELETE = async function({ params }) {
    await deleteUser(params.id)
    return new Response(null, {
        status: 200
    })
} satisfies RequestHandler