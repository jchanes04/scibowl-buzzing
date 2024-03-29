import { redirectTo } from "$lib/functions/redirectTo";
import { getRandomQuestionId } from "$lib/mongo";

export async function get() {
    const questionId = await getRandomQuestionId()
    if (questionId) return redirectTo('/question/' + questionId)
}