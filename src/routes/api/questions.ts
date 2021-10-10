import type { Request } from "@sveltejs/kit";
import { getIDFromToken } from "../../authentication";
import { category, getQuestions } from "../../mongo";

export async function get({ query, headers }: { query: URLSearchParams, headers: Record<string, string> }) {
    let authToken = headers.authorization
    let authorized = !!getIDFromToken(authToken)
    
    if (!authorized) return {
        status: 401
    }

    let author = query.get("author")
    let keywords = query.get("keywords")
    let categories = <category[]>query.get("categories")?.split(",")
    let types = <("MCQ" | "SA")[]>query.get("types")?.split(",")
    let start = parseInt(query.get("start"))
    let end = parseInt(query.get("end"))

    if (isNaN(start)) start = undefined
    if (isNaN(end)) end = undefined

    let startDate = typeof start === "number" ? new Date(start) : undefined
    let endDate = typeof end === "number" ? new Date(end) : undefined
    
    let result = await getQuestions({ author, keywords, categories, types, timeRange: { startDate, endDate } })
    return {
        status: 302,
        body: result
    }
}