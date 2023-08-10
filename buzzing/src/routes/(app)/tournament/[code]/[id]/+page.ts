import type { PageLoad } from "./$types"

export const load = async function({ parent, params }) {
    const { games } = await parent()
    const selectedGame = games.find(x => x.gameId === params.id)

    return {
        selectedGame
    }
} satisfies PageLoad