import type { Request } from "@sveltejs/kit";
import { getGame } from "../../../server";

export function get({ params }: Request) {
    let { id } = params

    let game = getGame(id)

    let memberList = game.members.map(m => m.self)
    let teamList = game.teams.map(x => x.self)

    return {
        body: {
            gameInfo: {
                gameName: game.name,
                joinCode: game.joinCode,
                teamFormat: game.teamFormat
            },
            memberList,
            teamList,
        }
    }
}