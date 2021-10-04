import type { Request } from "@sveltejs/kit";
import { category, getQuestionByID } from "../../../mongo";

export async function get({ params }: { params: Record<string, string> }) {
    let { id } = params

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