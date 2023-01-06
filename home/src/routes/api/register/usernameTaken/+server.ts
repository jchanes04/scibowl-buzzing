import { getUserFromUsername } from '$lib/mongo'
import { RequestHandler } from "./$types"

export async function GET({ url }) {
    const username = url.searchParams.get('username')
    const taken = !!(await getUserFromUsername(username))
    return new Response(JSON.stringify({ taken }))
} satisfies RequestHandler