import { generateGameToken } from "$lib/authentication"
import { createNewGame } from "$lib/server"
import { fail, redirect } from "@sveltejs/kit"
import type { Actions } from "./$types"
import { env } from "$env/dynamic/public"

// TODO: zod validation

export const actions = {
    default: async function ({ request, cookies }) {
        const body = await request.formData()
        const ownerName = body.get("owner-name") as string
        const gameName = body.get("game-name") as string
        const individualsAllowed = body.get("individual-teams-allowed") as string === "on"
        const newTeamsAllowed = body.get("new-teams-allowed") as string === "on"
        const spectatorsAllowed = body.get("spectators-allowed") as string === "on"
        const teamNames = JSON.parse(body.get('teams') as string || "[]")

        // Extract timer settings (extra time is always 2 seconds)
        const tossupTime = parseInt(body.get("tossup-time") as string) || 5
        const bonusTime = parseInt(body.get("bonus-time") as string) || 20
        const visualTime = parseInt(body.get("visual-time") as string) || 30

        // Extract point values
        const tossupPoints = parseInt(body.get("tossup-points") as string) || 4
        const bonusPoints = parseInt(body.get("bonus-points") as string) || 10
        const penaltyPoints = parseInt(body.get("penalty-points") as string) || -4

        const gameData = {
            name: gameName,
            settings: {
                individualsAllowed,
                newTeamsAllowed,
                spectatorsAllowed
            },
            teamNames,
            times: {
                tossup: [tossupTime, 2] as [number, number],
                bonus: [bonusTime, 2] as [number, number],
                visual: [visualTime, 2] as [number, number]
            },
            pointValues: {
                tossup: tossupPoints,
                bonus: bonusPoints,
                penalty: penaltyPoints
            }
        }

        const { game, ownerId } = await createNewGame(ownerName, gameData)

        const gameToken = generateGameToken({ memberId: ownerId, gameId: game.id })
        cookies.set("gameToken", gameToken, {
            path: "/",
            domain: (new URL(env.PUBLIC_COOKIE_URL as string)).hostname
        })

        redirect(302, "/game/" + game.id)
    }
} satisfies Actions