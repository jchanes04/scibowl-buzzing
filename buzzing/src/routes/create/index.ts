import type { Request } from "@sveltejs/kit";
import type { ReadOnlyFormData } from "@sveltejs/kit/types/helper";
import { createNewGame } from "../../server";

export async function post(request: Request) {
    try {
        const formData = <ReadOnlyFormData>request.body
        const ownerName = formData.get("owner-name")
        const gameName = formData.get("game-name")
        const teamFormat = <'any' | 'individuals' | 'teams'>formData.get("team-format")
        const teamNames = JSON.parse(formData.get('teams') || "[]")

        const ownerData = {
            name: ownerName,
            reader: true
        }
        const gameData = {
            name: gameName,
            teamFormat,
            teamNames
        }

        const game = createNewGame(ownerData, gameData)

        return {
            headers: {
                'Location': "/game/" + game.id,
                'Set-Cookie': "memberID=" + game.owner.id + "; Max-Age=3600"
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