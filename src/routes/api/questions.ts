import type { Request } from "@sveltejs/kit";
import { category, getQuestions } from "../../mongo";

export async function get({ query }: { query: URLSearchParams }) {
    let author = query.get("author")
    let categories = <category[]>query.get("categories")?.split(",")
    let types = <("MCQ" | "SA")[]>query.get("types")?.split(",")
    let start = parseInt(query.get("start"))
    let end = parseInt(query.get("end"))

    console.log(types)

    if (isNaN(start)) start = undefined
    if (isNaN(end)) end = undefined

    let startDate = typeof start === "number" ? new Date(start) : undefined
    let endDate = typeof end === "number" ? new Date(end) : undefined
    
    let result = await getQuestions({ author, categories, types, timeRange: { startDate, endDate } })
    return {
        status: 302,
        body: result
    }
}