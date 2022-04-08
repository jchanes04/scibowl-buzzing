import { redirectTo } from "$lib/functions/redirectTo";
import type { RequestEvent } from "@sveltejs/kit";
import { addQuestion, category, getUserFromID } from "$lib/mongo";

export async function post({ request, locals }: RequestEvent) {
    try {
        const formData = await request.formData()
        const userId = formData.get("user-id") as string
        const ownQuestion = formData.get("own-question")
        const authorName = formData.get("author-name")
        const type = formData.get("type") as "MCQ" | "SA"
        const category = formData.get("category") as category
        const questionText = formData.get("question-text")
        
        const choices = {
            W: formData.get("W") as string,
            X: formData.get("X") as string,
            Y: formData.get("Y") as string,
            Z: formData.get("Z") as string
        }
        const correctAnswer = formData.get("correct-answer") as "W" | "X" | "Y" | "Z"
        const answer = formData.get("answer")

        let question: any = {}
        if (ownQuestion && userId) {
            const userData = await getUserFromID(userId)
            if (userData) {
                question = {
                    authorName: userData.username,
                    authorId: userId
                }
            } else {
                return redirectTo("error/invalid-question")
            }
        } else {
            question = {
                authorName: authorName
            }
        }
        question = {
            ...question,
            type,
            category,
            questionText
        }
        
        if (type == "MCQ") {
            question = {
                ...question,
                choices,
                correctAnswer
            }
        } else if (type === "SA") {
            question = {
                ...question,
                correctAnswer: answer
            }
        }

        await addQuestion(question)

        return redirectTo("question-submitted")
    } catch (e) {
        console.error(e)
        return redirectTo("error/invalid-question")
    }
}