import type { Request } from "@sveltejs/kit";
import { getIDFromToken } from "../../authentication";
import { category, getQuestions } from "../../mongo";

export async function get({ query, headers }: { query: URLSearchParams, headers: Record<string, string> }) {
    const authToken = headers.authorization
    const authorized = !!getIDFromToken(authToken)
    
    if (!authorized) return {
        status: 401
    }

    const authorName = query.get("authorName")
    const authorId = query.get("authorId")
    const keywords = query.get("keywords")
    const categories = <category[]>query.get("categories")?.split(",")
    const types = <("MCQ" | "SA")[]>query.get("types")?.split(",")
    let startDate = new Date(query.get("start") || "")
    let endDate = new Date(query.get("end") || "")

    if (isNaN(startDate.getTime())) startDate = undefined
    if (isNaN(endDate.getTime())) endDate = undefined
    
    const result = await getQuestions({ authorName, authorId, keywords, categories, types, timeRange: { startDate, endDate } })
    return {
        status: 302,
        body: result
    }
}