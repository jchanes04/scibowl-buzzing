import { searchByKeywords } from "../mongo"

export async function get({ query }) {
    return {
        status: 302,
        body: await searchByKeywords(query.get("search"))
    }
}