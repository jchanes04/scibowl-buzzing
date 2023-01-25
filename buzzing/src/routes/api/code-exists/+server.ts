import type { RequestHandler } from "./$types";
import { getGameFromCode } from '$lib/server'

export const GET = async function({ url }) {
    const code = url.searchParams.get('code')
    return new Response(JSON.stringify({
        exists: !!getGameFromCode(code)
    }))
} satisfies RequestHandler