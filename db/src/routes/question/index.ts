import { redirectTo } from "$lib/functions/redirectTo";
import { getRandomQuestionId } from "../../mongo";

export async function get() {
    let questionId = await getRandomQuestionId()
    if (questionId) return redirectTo('/question/' + questionId)
}