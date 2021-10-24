import { category, getQuestions } from "../../mongo"

export async function get({ query }: { query: URLSearchParams }) {
    let author = query.get("author")
    let categories = <category[]>query.get("categories")?.split(",")
    let types = <("MCQ" | "SA")[]>query.get("types")?.split(",")
    let start = parseInt(query.get("start"))
    let end = parseInt(query.get("end"))

    if (isNaN(start)) start = undefined
    if (isNaN(end)) end = undefined

    let startDate = typeof start === "number" ? new Date(start) : undefined
    let endDate = typeof end === "number" ? new Date(end) : undefined
    
    let questions = await getQuestions({ author, categories, types, timeRange: { startDate, endDate } })
    if (questions.length === 0) {
        return {
            status: 302,
            body: {
                error: 'No questions matched the query'
            }
        }
    } else {
        return {
            status: 302,
            body: questions[Math.floor(Math.random() * questions.length)]
        }
    }
}