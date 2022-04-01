import type { RequestEvent } from "@sveltejs/kit";
import { getGameFromCode } from '$lib/server'

export async function get({ url }: RequestEvent) {
    const code = url.searchParams.get('code')
    return {
        body: {
            exists: !!getGameFromCode(code)
        }
    }
}