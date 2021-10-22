import type { Request } from "@sveltejs/kit";
import { getIDFromToken } from "../../../../authentication";
import { getUserByID } from "../../../../mongo";

export async function get({ params, headers }: Request) {
    let authToken = headers.authorization
    let { id } = params
    let authorized = !!getIDFromToken(authToken)

    if (!authorized) return {
        status: 401
    }

    let result = await getUserByID(id)
    if (result) {
        return {
            status: 302,
            body: result
        }
    } else {
        return {
            status: 302,
            body: { error: 'No user exists with that ID' }
        }
    }
}