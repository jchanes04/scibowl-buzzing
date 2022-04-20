import type { RequestEvent } from "@sveltejs/kit";
import { getGame } from "$lib/server";

export function get({ params }: RequestEvent) {
    const { id } = params

    const game = getGame(id)

    if (!game) return {
        body: {}
    }
    
    const memberNames = game.members.map(x => x.name)
    const settings = game.settings
    const teams = game.teams.map(t => t.data).filter(t => !t.individual)

    return new Response(
        JSON.stringify({
            memberNames,
            gameName: game.name,
            settings,
            teams
        })
    )
}