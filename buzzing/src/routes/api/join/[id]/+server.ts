import { json } from '@sveltejs/kit';
import type { RequestHandler } from "./$types";
import { getGame } from "$lib/server";

export const GET = async function({ params }) {
    const { id } = params

    const game = getGame(id)

    if (!game) return json({})
    
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
} satisfies RequestHandler