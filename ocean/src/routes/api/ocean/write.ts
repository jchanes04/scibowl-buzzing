import { writeAnswers } from "../../../server";

export async function get({ query, headers }: { query: URLSearchParams, headers: Record<string, string> }) {
    let answers = JSON.parse(query.get("answers"))
    let Name = query.get("Name")
    console.log("writing")
    let result = await writeAnswers(answers,Name)
    return {
        status: 302,
        body: result
    }
}