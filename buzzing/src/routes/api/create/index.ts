import { generateToken } from "$lib/authentication";
import type { RequestEvent } from "@sveltejs/kit";
import { createNewGame } from "$lib/server";

export async function post({ request }: RequestEvent) {
    try {
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

        const authToken = generateToken({ memberId: game.moderators[0].id, gameId: game.id })
        return {
            headers: {
                'Location': "/game/" + game.id,
                'Set-Cookie': "authToken=" + authToken + ";Path=/;Domain=" + (import.meta.env.VITE_HOST_URL as string).replace(/https?:\/\//, "").replace(/:[0-9]{1,4}/, "")
            },
            status: 302
        }
    } catch (e) {
        console.error(e)
        return {
            headers: {
                'Location': "/error/invalid-create"
            },
            status: 302
        }
    }
}