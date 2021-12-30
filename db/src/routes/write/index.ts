import { redirectTo } from "$lib/functions/redirectTo";
import type { Request } from "@sveltejs/kit";
import type { ReadOnlyFormData } from "@sveltejs/kit/types/helper";
import { addQuestion, category, getUserFromID, McqBase, McqQuestion, SaBase, SaQuestion } from "../../mongo";

export async function post(request: Request) {
    try {
        const authToken = request.headers.cookie?.split("; ").find(x => x.split("=")[0] === "authToken").split("=")[1]

        const formData = <ReadOnlyFormData>request.body
        const userId = formData.get("user-id")
        const ownQuestion = formData.get("own-question")
        const authorName = formData.get("author-name")
        const type= <"MCQ" | "SA">formData.get("type")
        const category = <category>formData.get("category")
        const questionText = formData.get("question-text")
        
        const choices = {
            W: formData.get("W"),
            X: formData.get("X"),
            Y: formData.get("Y"),
            Z: formData.get("Z")
        }
        const correctAnswer = <"W" | "X" | "Y" | "Z">formData.get("correct-answer")
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