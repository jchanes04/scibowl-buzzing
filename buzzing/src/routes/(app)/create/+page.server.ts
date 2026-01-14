import { generateGameToken } from "$lib/authentication"
import { createNewGame } from "$lib/server"
import { fail, redirect } from "@sveltejs/kit"
import type { Actions } from "./$types"
import { env } from "$env/dynamic/public"
import { getConvexClient, api } from "$lib/convex.server"

// TODO: zod validation

export const actions = {
    default: async function ({ request, cookies }) {
        const body = await request.formData()
        const ownerName = body.get("owner-name") as string
        const gameName = body.get("game-name") as string
        const individualsAllowed = body.get("individual-teams-allowed") as string === "on"
        const newTeamsAllowed = body.get("new-teams-allowed") as string === "on"
        const spectatorsAllowed = body.get("spectators-allowed") as string === "on"
        const teamNames = JSON.parse(body.get('teams') as string || "[]")

        const gameData = {
            name: gameName,
            settings: {
                individualsAllowed,
                newTeamsAllowed,
                spectatorsAllowed
            },
            teamNames
        }

        const game = await createNewGame(ownerName, gameData)

        // Get owner from cache (GameManager already created everything in Convex)
        const ownerFromCache = game.getCachedMember(game.getCachedMember ?
            Object.keys(game.getCachedMember).find(id => {
                const m = game.getCachedMember(id);
                return m?.type === "moderator";
            }) || "" : "")

        // Get owner ID - need to query Convex since we don't have direct access to moderators anymore
        const convex = getConvexClient()
        const members = await convex.query(api.gameMembers.getAllForGame, { gameId: game.id })
        const owner = members.find(m => m.type === "moderator")!

        const gameToken = generateGameToken({ memberId: owner.memberId, gameId: game.id })
        cookies.set("gameToken", gameToken, {
            path: "/",
            domain: (new URL(env.PUBLIC_COOKIE_URL as string)).hostname
        })

        redirect(302, "/game/" + game.id)
    }
} satisfies Actions