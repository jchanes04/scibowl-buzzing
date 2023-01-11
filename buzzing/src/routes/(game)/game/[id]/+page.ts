import type { GameInfo } from "$lib/stores/gameInfo"
import type { PageLoad } from "./$types"

export const load = async function({ params, fetch }) {

    const res = await fetch(`/api/game/${params.id}`)

    if (res.ok) {
        const json = await res.json()
        return {
            gameInfo: {
                ...json?.gameInfo,
                gameId: params.id,
            } as GameInfo,
            teamList: json.teamList,
            moderatorList: json.moderatorList
        }
    }

    return {}
} satisfies PageLoad
