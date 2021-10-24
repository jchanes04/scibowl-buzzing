import { redirectTo } from "$lib/functions/redirectTo";
import type { Request } from "@sveltejs/kit";
import type { ReadOnlyFormData } from "@sveltejs/kit/types/helper";
import { editQuestion, category, McqBase, McqQuestion, SaBase, SaQuestion, getQuestionByID } from "../../mongo";

export async function post(request: Request) {
    try {
        let formData = <ReadOnlyFormData>request.body
        console.dir(formData)
        let id = request.params.id
        let userId = formData.get('user-id')
        let type= <"MCQ" | "SA">formData.get("type")
        let category = <category>formData.get("category")
        let questionText = formData.get("question-text")
        let date = new Date()
        let choices = {
            W: formData.get("W"),
            X: formData.get("X"),
            Y: formData.get("Y"),
            Z: formData.get("Z")
        }
        let correctAnswer = <"W" | "X" | "Y" | "Z">formData.get("correct-answer")
        let answer = formData.get("answer")

        let currentQuestion = await getQuestionByID(id)
        if (userId !== currentQuestion.authorId) {
            return redirectTo("error/no-edit-permission")
        }
        
        let updatedInfo: Partial<SaQuestion | McqQuestion>
        if (type == "MCQ") {
            updatedInfo = {
                type,
                category,
                questionText,
                choices,
                correctAnswer,
                date,
                id
            }
        } else if (type === "SA") {
            updatedInfo = {
                type,
                category,
                questionText,
                correctAnswer: answer,
                date,
                id
            }
        }

        await editQuestion(updatedInfo)
        
        return redirectTo("/question-submitted")
    } catch (e) {
        console.error(e)
        return redirectTo("/error/invalid-question")
    }
}