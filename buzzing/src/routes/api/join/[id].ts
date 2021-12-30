import type { Request } from "@sveltejs/kit";
import { getGame } from "../../../server";

export function get({ params }: Request) {
    const { id } = params

    const game = getGame(id)

    if (!game) return {
        body: {}
    }
    
    const memberNames = game.members.map(x => x.name)
    const teamFormat = game.teamFormat
    const teams = game.teams.map(t => t.self).filter(t => !t.individual)

    return {
        body: {
            memberNames,
            gameName: game.name,
            teamFormat,
            teams
        }
    }
}