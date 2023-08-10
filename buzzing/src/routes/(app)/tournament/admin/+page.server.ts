import { getDataFromLoginToken } from "$lib/authentication"
import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"
import { createTournament, getAllTournaments } from "$lib/mongo"
import { createTournamentCode, createTournamentPassword } from "$lib/functions/createId"
import argon2 from "argon2"

export const load = async function({ cookies }) {
    const token = cookies.get("loginToken")
    const tokenData = await getDataFromLoginToken(token || "")
    if (!tokenData?.admin) {
        throw redirect(302, "/tournament/login")
    }

    const tournaments = await getAllTournaments()
    return {
        tournaments: tournaments.map(t => ({
            name: t.name,
            code: t.code,
            gameIds: t.gameIds
        }))
    }
} satisfies PageServerLoad

export const actions = {
    default: async function({ request }) {
        const data = await request.formData()
        const tournamentName = data.get("tournament-name")
        
        if (typeof tournamentName !== "string") {
            return fail(400)
        }

        const code = createTournamentCode()
        const password = createTournamentPassword()
        const passwordHash = await argon2.hash(password)
        await createTournament({
            code,
            passwordHash,
            name: tournamentName
        })

        return {
            code,
            password
        }
    }
} satisfies Actions