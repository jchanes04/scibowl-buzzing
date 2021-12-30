import type { Request } from "@sveltejs/kit";
import { getGame } from "../../../server";

export function get({ params }: Request) {
    const { id } = params

    const game = getGame(id)

    const memberList = game.members.map(m => m.self)
    const teamList = game.teams.map(x => x.self)

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