import type { Request } from "@sveltejs/kit";
import { category, getQuestions } from "../../mongo";

export async function get({ query }: { query: URLSearchParams }) {
    let author = query.get("author")
    let category = <category>query.get("category")
    let type = <"MCQ" | "SA">query.get("type")
    let start = parseInt(query.get("start"))
    let end = parseInt(query.get("end"))

    if (isNaN(start)) start = undefined
    if (isNaN(end)) end = undefined

    let startDate = typeof start === "number" ? new Date(start) : undefined
    let endDate = typeof end === "number" ? new Date(end) : undefined
    
    let result = await getQuestions({ author, category, type, timeRange: { startDate, endDate } })
    return {
        status: 302,
        body: result
    }
}