import { generateGameToken } from "$lib/authentication"
import type { Game } from "$lib/classes/Game"
import { Player } from "$lib/classes/Player"
import { Team } from "$lib/classes/Team"
import { getGame, io } from "$lib/server"
import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"
import { env } from "$env/dynamic/public"
import { api } from "../../../../../convex/_generated/api"
import { convex } from "$lib/convexClient"

export const load = async function ({ params, url }) {
    const { id } = params
    const code = url.searchParams.get('code')
    const game = await getGame(id)

    if (!game) redirect(302, "/join")

    if (code !== game.joinCode) {
        if (game.settings.spectatorsAllowed) {
            redirect(302, "/spectate/" + id)
        } else {
            redirect(302, "/join")
        }
    }

    const settings = game.settings

    return {
        gameName: game.name,
        settings,
    }
} satisfies PageServerLoad

export const actions = {
    default: async function ({ request, params, cookies }) {
        const body = await request.formData()
        const name = body.get("name") as string
        const teamOrIndiv = body.get("team-or-indiv") as string

        const { id } = params
        const game = await getGame(id)

        if (!game) return fail(400, { error: "Invalid game" })

        // Check if user is authenticated
        const userCookie = cookies.get('workos_user')
        let playerId: string

        if (userCookie) {
            try {
                const userData = JSON.parse(userCookie)
                playerId = userData.id
            } catch (error) {
                playerId = generatePlayerId()
            }
        } else {
            // Generate random ID for guest users
            playerId = generatePlayerId()
        }

        
        convex.mutation(api.games.addPlayer, {
            gameId: game.id as any,
            externalId: playerId,
            name, 
            connected: true,
            teamId: teamOrIndiv === 'team' ? body.get('team-id') as string : undefined,
            isCaptain: false
        }).catch(console.error)
        const gameToken = generateGameToken({ memberId: playerId, gameId: game.id }, '6h')
        cookies.set("gameToken", gameToken, {
            path: "/",
            domain: (new URL(env.PUBLIC_COOKIE_URL as string)).hostname
        })
        redirect(302, "/game/" + game.id)
    }
} satisfies Actions

function generatePlayerId(): string {
    return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

function createPlayer(name: string, teamOrIndiv: string, game: Game, body: FormData, playerId?: string) {
    if (teamOrIndiv === 'team') {
        const teamId = body.get('team-id') as string
        const team = game.teams[teamId]

        return team ? new Player({ name, team, id: playerId }) : null
    } else if (teamOrIndiv === 'new-team') {
        const teamName = body.get('new-team-name') as string
        const team = new Team(teamName)

        return new Player({ name, team, id: playerId })
    } else {
        return new Player({ name, id: playerId })
    }
}