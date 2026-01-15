import { generateGameToken } from "$lib/authentication"
import { createMemberID, createTeamID } from "$lib/functions/createId"
import { getGame, io } from "$lib/server"
import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"
import { env } from "$env/dynamic/public"
import { addChatMessage, getConvexClient, api } from "$lib/convex.server"

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

    const memberNames = Object.values(game.players).map(x => x.name)
    const settings = game.settings
    // game.teams returns CachedTeam which already has the right shape
    const teams = Object.values(game.teams).filter(t => t.type !== "individual")

    return {
        memberNames,
        settings,
        teams,
        gameName: game.name
    }
} satisfies PageServerLoad

export const actions = {
    default: async function ({ request, params, cookies }) {
        const body = await request.formData()
        const name = body.get("name") as string
        const teamOrIndiv = body.get("team-or-indiv") as string

        const { id: gameId } = params
        const game = await getGame(gameId)

        if (!game) return fail(400, { error: "Invalid game" })

        const convex = getConvexClient()
        const playerId = createMemberID()
        let teamId: string
        let teamName: string
        let teamType: "default" | "created" | "individual"

        if (teamOrIndiv === 'team') {
            // Join existing team
            teamId = body.get('team-id') as string
            const existingTeam = game.teams[teamId]
            if (!existingTeam) {
                return fail(400, { error: "Invalid team" })
            }
            teamName = existingTeam.name
            teamType = existingTeam.type
        } else if (teamOrIndiv === 'new-team') {
            // Create new team
            teamId = createTeamID()
            teamName = body.get('new-team-name') as string
            teamType = "created"

            // Add new team to Convex
            await convex.mutation(api.teams.add, {
                gameId,
                teamId,
                name: teamName,
                type: "created"
            })
        } else {
            // Individual player - create individual team
            teamId = createTeamID()
            teamName = name
            teamType = "individual"

            // Add individual team to Convex
            await convex.mutation(api.teams.add, {
                gameId,
                teamId,
                name: teamName,
                type: "individual"
            })
        }

        // Add player to Convex
        await convex.mutation(api.gameMembers.add, {
            gameId,
            memberId: playerId,
            name,
            type: "player",
            teamId
        })

        // Emit socket event for instant UI update
        const playerData = { id: playerId, name, type: "player" as const, teamID: teamId }
        const teamData = { id: teamId, name: teamName, type: teamType, captainId: null }
        io.to(gameId).emit('playerJoin', { player: playerData, team: teamData })

        // Add chat message for player joining
        await addChatMessage({
            gameId,
            text: `${name} has joined the game`,
            type: "notification"
        })

        const gameToken = generateGameToken({ memberId: playerId, gameId }, '6h')
        cookies.set("gameToken", gameToken, {
            path: "/",
            domain: (new URL(env.PUBLIC_COOKIE_URL as string)).hostname
        })
        redirect(302, "/game/" + gameId)
    }
} satisfies Actions