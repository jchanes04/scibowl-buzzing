import { generateToken } from "$lib/authentication"
import { createNewGame } from "$lib/server"
import { redirect } from "@sveltejs/kit"
import type { Actions } from "./$types"

// TODO: zod validation

export const actions = {
    default: async function({ request, cookies }) {
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

        const game = createNewGame(ownerName, gameData)

        const authToken = generateToken({ memberId: Object.values(game.moderators)[0].id, gameId: game.id })
        cookies.set("authToken", authToken, {
            path: "/",
            domain: (import.meta.env.VITE_HOST_URL as string)
                .replace(/https?:\/\//, "").replace(/:[0-9]{1,4}/, "")
        })
        throw redirect(302, "/game/" + game.id)
    }
} satisfies Actions