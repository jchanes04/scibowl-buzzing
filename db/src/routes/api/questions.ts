import type { Request } from "@sveltejs/kit";
import { getIDFromToken } from "../../authentication";
import { category, getQuestions } from "../../mongo";

export async function get({ query, headers }: { query: URLSearchParams, headers: Record<string, string> }) {
    let authToken = headers.authorization
    let authorized = !!getIDFromToken(authToken)
    
    if (!authorized) return {
        status: 401
    }

    let authorName = query.get("authorName")
    let authorId = query.get("authorId")
    let keywords = query.get("keywords")
    let categories = <category[]>query.get("categories")?.split(",")
    let types = <("MCQ" | "SA")[]>query.get("types")?.split(",")
    let startDate = new Date(query.get("start") || "")
    let endDate = new Date(query.get("end") || "")

    if (isNaN(startDate.getTime())) startDate = undefined
    if (isNaN(endDate.getTime())) endDate = undefined
    
    let result = await getQuestions({ authorName, authorId, keywords, categories, types, timeRange: { startDate, endDate } })
    return {
        status: 302,
        body: result
    }
}