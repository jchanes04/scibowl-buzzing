import type { PageLoad } from "./$types";

export const load = async function({ params, fetch }) {

    const res = await fetch(`/api/join/${params.id}`)

    if (res.ok) {
        const json = await res.json()
        return {
            ...json,
            gameId: params.id
        }
    }

    return {}
} satisfies PageLoad
