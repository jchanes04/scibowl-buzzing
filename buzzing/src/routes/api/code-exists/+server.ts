import type { RequestHandler } from "./$types";
import { getGameFromCode } from '$lib/server'

export const GET = async function ({ url }) {
    const code = url.searchParams.get('code')
    return new Response(JSON.stringify({
        exists: !!(code && await getGameFromCode(code))
    }))
} satisfies RequestHandler