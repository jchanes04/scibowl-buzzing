import { redirectTo } from "$lib/functions/redirectTo";
import type { Request } from "@sveltejs/kit";
import type { ReadOnlyFormData } from "@sveltejs/kit/types/helper";
import { editQuestion, category, McqBase, McqQuestion, SaBase, SaQuestion, getQuestionByID } from "../../mongo";

export async function post({ body, params }: Request) {
    try {
        const formData = <ReadOnlyFormData>body
        const { id } = params
        const userId = formData.get('user-id')
        const type= <"MCQ" | "SA">formData.get("type")
        const category = <category>formData.get("category")
        const questionText = formData.get("question-text")
        const date = new Date()
        const choices = {
            W: formData.get("W"),
            X: formData.get("X"),
            Y: formData.get("Y"),
            Z: formData.get("Z")
        }
        const correctAnswer = <"W" | "X" | "Y" | "Z">formData.get("correct-answer")
        const answer = formData.get("answer")

        const currentQuestion = await getQuestionByID(id)
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