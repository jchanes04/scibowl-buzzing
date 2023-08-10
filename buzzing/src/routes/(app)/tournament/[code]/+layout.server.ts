import { getTournament, getTournamentScores } from "$lib/mongo"
import { redirect } from "@sveltejs/kit"
import type { LayoutServerLoad } from "./$types"
import { getDataFromLoginToken } from "$lib/authentication"

export const load = async function({ params, cookies }) {
    const { code } = params
    const tournament = await getTournament(code)
    if (!tournament) throw redirect(302, "/tournament/login")

    const token = cookies.get("loginToken")
    const tokenData = await getDataFromLoginToken(token || "")
    if (!tokenData?.admin && tokenData?.code !== code) {
        throw redirect(302, "/tournament/login")
    }

    const games = getTournamentScores(tournament.gameIds)

    return {
        code: tournament.code,
        name: tournament.name,
        games
    }
} satisfies LayoutServerLoad