import { generateToken } from "$lib/authentication";
import type { RequestEvent } from "@sveltejs/kit";
import { createNewGame } from "$lib/server";

export async function post({ request }: RequestEvent) {
    try {
        const body = await request.formData()
        const ownerName = body.get("owner-name") as string
        const gameName = body.get("game-name") as string
        const individualsAllowed = body.get("individual-teams-allowed") as string === "checked"
        const newTeamsAllowed = body.get("individual-teams-allowed") as string === "checked"
        const teamNames = JSON.parse(body.get('teams') as string || "[]")
        const gameData = {
            name: gameName,
            teamSettings: {
                individualsAllowed,
                newTeamsAllowed
            },
            teamNames
        }

        const game = createNewGame(ownerName, gameData)

        const authToken = generateToken({ memberId: game.moderators[0].id, gameId: game.id })
        return {
            headers: {
                'Location': "/game/" + game.id,
                'Set-Cookie': "authToken=" + authToken + ";Path=/"
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