import { fail, redirect } from "@sveltejs/kit"
import type { Actions } from "./$types"
import { getTournament } from "$lib/mongo"
import argon2 from "argon2"
import jwt from "jsonwebtoken"
import fs from "fs/promises"
import { generateLoginToken } from "$lib/authentication"

export const actions = {
    default: async function({ request, cookies }) {
        const data = await request.formData()
        const tournamentCode = data.get("tournament-code")
        const password = data.get("password")

        if (
            typeof tournamentCode !== "string"
            || typeof password !== "string"
        ) {
            return fail(400)
        }

        const tournament = await getTournament(tournamentCode)
        if (!tournament) {
            return fail(401)
        }

        const authorized = await argon2.verify(tournament.passwordHash, password)
        if (authorized) {
            const token = await generateLoginToken({ admin: !!tournament.admin, code: tournamentCode })
            cookies.set("loginToken", token)
            throw redirect(302, "/tournament/" + tournament.code)
        } else {
            return fail(401)
        }
    }
} satisfies Actions