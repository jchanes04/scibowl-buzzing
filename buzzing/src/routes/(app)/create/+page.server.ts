import { generateGameToken } from "$lib/authentication"
import { createNewGame } from "$lib/server"
import { fail, redirect } from "@sveltejs/kit"
import type { Actions } from "./$types"
import { env } from "$env/dynamic/public"

// TODO: zod validation

export const actions = {
    default: async function ({ request, cookies, locals }) {
        const body = await request.formData()
        const ownerName = body.get("owner-name") as string
        const gameName = body.get("game-name") as string
        const individualsAllowed = body.get("individual-teams-allowed") as string === "on"
        const newTeamsAllowed = body.get("new-teams-allowed") as string === "on"
        const spectatorsAllowed = body.get("spectators-allowed") as string === "on"
        const teamNames = JSON.parse(body.get('teams') as string || "[]")

        const gameData = {
            name: gameName,
            settings: {
                individualsAllowed,
                newTeamsAllowed,
                spectatorsAllowed
            },
            teamNames
        }

        const game = await createNewGame(ownerName, gameData, locals.user?.id || "")

        const gameToken = generateGameToken({ memberId: game.moderatorIds.values().next().value ?? "", gameId: game.id })
        cookies.set("gameToken", gameToken, {
            path: "/",
            domain: (new URL(env.PUBLIC_COOKIE_URL as string)).hostname
        })

        redirect(302, "/game/" + game.id)
    }
} satisfies Actions