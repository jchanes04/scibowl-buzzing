import { getUserFromUsername } from '$lib/mongo'
import type { RequestEvent } from '@sveltejs/kit'

export async function get({ url }: RequestEvent) {
    const username = url.searchParams.get('username')
    const taken = !!(await getUserFromUsername(username))
    return new Response(JSON.stringify({ taken }))
}