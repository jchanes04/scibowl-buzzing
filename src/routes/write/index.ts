import { redirectTo } from "$lib/functions/redirectTo";
import type { Request } from "@sveltejs/kit";
import type { ReadOnlyFormData } from "@sveltejs/kit/types/helper";
import { addQuestion, category, McqQuestion, SaQuestion } from "../../mongo";

export async function post(request: Request) {
    try {
        let formData = <ReadOnlyFormData>request.body
        let author = formData.get("author")
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
        
        let question: SaQuestion | McqQuestion
        if (type == "MCQ") {
            question = {
                author,
                type,
                category,
                questionText,
                choices,
                correctAnswer,
                date: new Date()
            }
        } else if (type === "SA") {
            question = {
                author,
                type,
                category,
                questionText,
                correctAnswer: answer,
                date: new Date()
            }
        }

        await addQuestion(question)

        return redirectTo("question-submitted")
    } catch (e) {
        console.error(e)
        return redirectTo("error/invalid-question")
    }
}