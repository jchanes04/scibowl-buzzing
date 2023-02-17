import { redirect } from "@sveltejs/kit"
import type { PageLoad } from "./$types"

export const load = function({ url }) {
    const code = url.searchParams.get('code')
    if (code) {
        return {}
    } else {
        throw redirect(302, "/forgot-password")
    }
} satisfies PageLoad