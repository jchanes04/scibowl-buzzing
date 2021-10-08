import { redirectTo } from "$lib/functions/redirectTo";
import type { Request } from "@sveltejs/kit";
import type { ReadOnlyFormData } from "@sveltejs/kit/types/helper";
import { editQuestion, category, McqBase, McqQuestion, SaBase, SaQuestion } from "../../mongo";

export async function post(request: Request) {
    try {
        let formData = <ReadOnlyFormData>request.body
        let id = request.params.id
        let author = formData.get("author")
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
        
        let question: SaQuestion | McqQuestion
        if (type == "MCQ") {
            question = {
                author,
                type,
                category,
                questionText,
                choices,
                correctAnswer,
                date,
                id

            }
        } else if (type === "SA") {
            question = {
                author,
                type,
                category,
                questionText,
                correctAnswer: answer,
                date,
                id
            }
        }

        await editQuestion(question)
        
        return redirectTo("question-submitted")
    } catch (e) {
        console.error(e)
        return redirectTo("error/invalid-question")
    }
}