import type { Request } from "@sveltejs/kit";
import { getIDFromToken } from "../../../authentication";
import { category, getQuestionByID } from "../../../mongo";

export async function get({ params, headers }: { params: Record<string, string>, headers: Record<string, string> }) {
    let authToken = headers.authorization
    let { id } = params
    let authorized = !!getIDFromToken(authToken)

    if (!authorized) return {
        status: 401
    }

    let result = await getQuestionByID(id)
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