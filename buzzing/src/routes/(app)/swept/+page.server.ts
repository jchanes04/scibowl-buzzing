import type { PageServerLoad } from "./$types"
import { env } from "$env/dynamic/public"

export const load = function({ cookies }) {
    cookies.delete("gameToken", {
        path: "/",
        domain: (new URL(env.PUBLIC_COOKIE_URL as string)).hostname
    })
} satisfies PageServerLoad