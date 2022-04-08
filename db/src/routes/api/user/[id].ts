import type { RequestEvent } from "@sveltejs/kit";
import { getUserByID } from "$lib/mongo";

export async function get({ params, locals }: RequestEvent) {
    const { id } = params

    if (!locals.userData) return {
        status: 401
    }

    const result = await getUserByID(id)
    if (result) {
        return {
            status: 302,
            body: result
        }
    } else {
        return {
            status: 302,
            body: { error: 'No questions matched the query' }
        }
    }
}