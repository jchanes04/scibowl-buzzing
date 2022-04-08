import { category, getQuestions } from "$lib/mongo"

export async function get({ query }: { query: URLSearchParams }) {
    const authorId = query.get("authorId")
    const authorName = query.get('authorName')
    const categories = <category[]>query.get("categories")?.split(",")
    const types = <("MCQ" | "SA")[]>query.get("types")?.split(",")
    let start = parseInt(query.get("start"))
    let end = parseInt(query.get("end"))

    if (isNaN(start)) start = undefined
    if (isNaN(end)) end = undefined

    const startDate = typeof start === "number" ? new Date(start) : undefined
    const endDate = typeof end === "number" ? new Date(end) : undefined
    
    const questions = await getQuestions({ authorId, authorName, categories, types, timeRange: { startDate, endDate } })
    if (questions.length === 0) {
        return {
            status: 404,
            body: {
                error: 'No questions matched the query'
            }
        }
    } else {
        return {
            status: 200,
            body: questions[Math.floor(Math.random() * questions.length)]
        }
    }
}