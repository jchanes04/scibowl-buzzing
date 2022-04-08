import type { RequestEvent } from "@sveltejs/kit";
import { category, getQuestions } from "$lib/mongo";

export async function get({ request, url, locals }: RequestEvent) { 
    if (!locals.userData) return {
        status: 401
    }

    const authorName = url.searchParams.get("authorName")
    const authorId = url.searchParams.get("authorId")
    const keywords = url.searchParams.get("keywords")
    const categories = <category[]>url.searchParams.get("categories")?.split(",")
    const types = <("MCQ" | "SA")[]>url.searchParams.get("types")?.split(",")
    let startDate = new Date(url.searchParams.get("start") || "")
    let endDate = new Date(url.searchParams.get("end") || "")

    if (isNaN(startDate.getTime())) startDate = undefined
    if (isNaN(endDate.getTime())) endDate = undefined
    
    const result = await getQuestions({ authorName, authorId, keywords, categories, types, timeRange: { startDate, endDate } })
    return {
        status: 302,
        body: result
    }
}