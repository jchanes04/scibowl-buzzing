import { redirectTo } from "$lib/functions/redirectTo";
import type { Request } from "@sveltejs/kit";
import type { ReadOnlyFormData } from "@sveltejs/kit/types/helper";
import { addQuestion, category, getUserFromID, McqBase, McqQuestion, SaBase, SaQuestion } from "../../mongo";

export async function post(request: Request) {
    try {
        let authToken = request.headers.cookie?.split("; ").find(x => x.split("=")[0] === "authToken").split("=")[1]

        let formData = <ReadOnlyFormData>request.body
        let userId = formData.get("user-id")
        let ownQuestion = formData.get("own-question")
        let authorName = formData.get("author-name")
        let type= <"MCQ" | "SA">formData.get("type")
        let category = <category>formData.get("category")
        let questionText = formData.get("question-text")
        
        let choices = {
            W: formData.get("W"),
            X: formData.get("X"),
            Y: formData.get("Y"),
            Z: formData.get("Z")
        }
        let correctAnswer = <"W" | "X" | "Y" | "Z">formData.get("correct-answer")
        let answer = formData.get("answer")

        let question: any = {}
        if (ownQuestion && userId) {
            let userData = await getUserFromID(userId)
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