import type { Request } from "@sveltejs/kit";
import { getGame } from "../../../server";

export function get({ params }: Request) {
    let { id } = params

    let game = getGame(id)

    if (!game) return {
        body: {}
    }
    
    let memberNames = game.members.map(x => x.name)
    let teamFormat = game.teamFormat
    let teams = game.teams.map(t => t.self).filter(t => !t.individual)

    return {
        body: {
            memberNames,
            gameName: game.name,
            teamFormat,
            teams
        }
    }
}