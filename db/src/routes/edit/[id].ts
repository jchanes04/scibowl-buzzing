import { redirectTo } from "$lib/functions/redirectTo";
import type { RequestEvent } from "@sveltejs/kit";
import { editQuestion, category, McqQuestion, SaQuestion, getQuestionByID } from "$lib/mongo";

export async function post({ request, params }: RequestEvent) {
    try {
        const formData = await request.formData()
        const { id } = params
        const userId = formData.get('user-id') as string
        const type= formData.get("type") as "MCQ" | "SA"
        const category = formData.get("category") as category
        const questionText = formData.get("question-text") as string
        const date = new Date()
        const choices = {
            W: formData.get("W") as string,
            X: formData.get("X") as string,
            Y: formData.get("Y") as string,
            Z: formData.get("Z") as string
        }
        const correctAnswer = formData.get("correct-answer") as "W" | "X" | "Y" | "Z"
        const answer = formData.get("answer") as string

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