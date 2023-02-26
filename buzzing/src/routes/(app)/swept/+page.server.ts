import type { PageServerLoad } from "./$types"

export const load = function({ cookies }) {
    cookies.delete("authToken", {
        path: "/",
        domain: (import.meta.env.VITE_HOST_URL as string)
                .replace(/https?:\/\//, "").replace(/:[0-9]{1,4}/, "")
    })
} satisfies PageServerLoad