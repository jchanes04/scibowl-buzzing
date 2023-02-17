import { getUserFromEmail } from '$lib/mongo'
import type { RequestHandler } from "./$types"

export const GET = async function({ url }) {
    const email = url.searchParams.get('email')
    const taken = !!(await getUserFromEmail(email))
    return new Response(JSON.stringify({ taken }))
} satisfies RequestHandler