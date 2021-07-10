import type { Request } from "@sveltejs/kit";
import type { ReadOnlyFormData } from "@sveltejs/kit/types/helper";
import { createNewGame } from "../../server";

export async function post(request: Request) {
    try {
        let formData = <ReadOnlyFormData>request.body
        let ownerName = formData.get("owner-name")
        let gameName = formData.get("game-name")
        let teamFormat = <'any' | 'individuals' | 'teams'>formData.get("team-format")
        let teamNames = JSON.parse(formData.get('teams') || "[]")

        let ownerData = {
            name: ownerName,
            reader: true
        }
        let gameData = {
            name: gameName,
            teamFormat,
            teamNames
        }

        let game = createNewGame(ownerData, gameData)

        return {
            headers: {
                'Location': "/game/" + game.id,
                'Set-Cookie': "memberID=" + game.owner.id
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