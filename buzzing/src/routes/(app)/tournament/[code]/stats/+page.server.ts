import calculateStatistics from "$lib/functions/statistics"
import { getStatistics, getTournament, getTournamentScores, updateStatistics } from "$lib/mongo"
import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

export const load = async function({ params }) {
    const { code } = params
    const stats = await getStatistics(code)

    if (!stats) return {
        code
    }

    const { playerStats, teamStats } = stats

    return {
        stats: {
            playerStats,
            teamStats
        },
        code
    }
} satisfies PageServerLoad

export const actions = {
    calculate: async function({ params }) {
        const tournament = await getTournament(params.code)
        if (!tournament) return fail(400)

        const games = await getTournamentScores(tournament.gameIds)
        const statistics = await calculateStatistics(games.map(g => g.scores))

        await updateStatistics(params.code, statistics)

        throw redirect(302, `/tournament/${params.code}/stats`)
    }
} satisfies Actions