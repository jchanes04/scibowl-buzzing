import type { Request } from "@sveltejs/kit";
import { getIDFromToken } from "../../../authentication";
import { getUserByID } from "../../../mongo";

export async function get({ params, headers }: Request) {
    const authToken = headers.authorization
    const { id } = params
    const authorized = !!getIDFromToken(authToken)

    if (!authorized) return {
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