import type { PageServerLoad } from "./$types"
import { env } from "$env/dynamic/public"

export const load = function({ cookies }) {
    cookies.delete("authToken", {
        path: "/",
        domain: (new URL(env.PUBLIC_COOKIE_URL as string)).host
    })
} satisfies PageServerLoad