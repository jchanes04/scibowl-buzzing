import { generateGameToken } from "$lib/authentication"
import type { Game } from "$lib/classes/Game"
import { Player } from "$lib/classes/Player"
import { Team } from "$lib/classes/Team"
import { getGame, io } from "$lib/server"
import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"
import { env } from "$env/dynamic/public"

export const load = async function({ params, url }) {
    const { id } = params
    const code = url.searchParams.get('code')
    const game = getGame(id)

    if (!game) throw redirect(302, "/join")

    if (code !== game.joinCode) {
        if (game.settings.spectatorsAllowed) {
            throw redirect(302, "/spectate/" + id)
        } else {
            throw redirect(302, "/join")
        }
    }

    const memberNames = Object.values(game.players).map(x => x.name)
    const settings = game.settings
    const teams = Object.values(game.teams).map(t => t.data).filter(t => t.type !== "individual")

    return {
        memberNames,
        settings,
        teams,
        gameName: game.name
    }
} satisfies PageServerLoad

export const actions = {
    default: async function({ request, params, cookies }) {
        const body = await request.formData()
        const name = body.get("name") as string
        const teamOrIndiv = body.get("team-or-indiv") as string

        const { id } = params
        const game = getGame(id)

        if (!game) return fail(400, { error: "Invalid game" })

        const player = createPlayer(name, teamOrIndiv, game, body)
        if (!player) {
            return fail(400, { error: "Invalid team" })
        }
        game.addPlayer(player)

        io.to(game.id).emit('playerJoin', { player: player.data, team: player.team.data })
    
        const gameToken = generateGameToken({ memberId: player.id, gameId: game.id }, '6h')
        cookies.set("gameToken", gameToken, {
            path: "/",
            domain: (new URL(env.PUBLIC_COOKIE_URL as string)).hostname
        })
        throw redirect(302, "/game/" + game.id)
    }
} satisfies Actions

function createPlayer(name: string, teamOrIndiv: string, game: Game, body: FormData) {
    if (teamOrIndiv === 'team') {
        const teamId = body.get('team-id') as string
        const team = game.teams[teamId]

        return team ? new Player({ name, team }) : null
    } else if (teamOrIndiv === 'new-team') {
        const teamName = body.get('new-team-name') as string
        const team = new Team(teamName)

        return new Player({ name, team })
    } else {
        return new Player({ name })
    }
}