import { generateGameToken } from "$lib/authentication"
import { createNewGame } from "$lib/server"
import { fail, redirect } from "@sveltejs/kit"
import type { Actions } from "./$types"
import { env } from "$env/dynamic/public"
import { createMemberID } from "$lib/functions/createId"

// Get or create a persistent member ID for the user
function getPersistentMemberId(cookies: any): { memberId: string, isNew: boolean } {
    // Check if user is logged in (has WorkOS user cookie)
    const workosUserCookie = cookies.get("workos_user")
    if (workosUserCookie) {
        try {
            const userData = JSON.parse(workosUserCookie)
            if (userData.id) {
                return { memberId: userData.id, isNew: false }
            }
        } catch (e) {
            // Fall through to anonymous handling
        }
    }

    // Check for existing persistent member ID cookie
    const existingMemberId = cookies.get("persistentMemberId")
    if (existingMemberId) {
        return { memberId: existingMemberId, isNew: false }
    }

    // Create new persistent member ID for anonymous user
    const newMemberId = createMemberID()
    return { memberId: newMemberId, isNew: true }
}

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

        // Extract timer settings (extra time is always 2 seconds)
        const tossupTime = parseInt(body.get("tossup-time") as string) || 5
        const bonusTime = parseInt(body.get("bonus-time") as string) || 20
        const visualTime = parseInt(body.get("visual-time") as string) || 30

        // Extract point values
        const tossupPoints = parseInt(body.get("tossup-points") as string) || 4
        const bonusPoints = parseInt(body.get("bonus-points") as string) || 10
        const penaltyPoints = parseInt(body.get("penalty-points") as string) || -4

        // Extract public tags (comma-separated string)
        const tagsInput = body.get("tags") as string || ""
        const tags = tagsInput
            .split(",")
            .map(t => t.trim())
            .filter(t => t.length > 0)

        // Get persistent member ID (from WorkOS or cookie)
        const { memberId: ownerId, isNew: isNewMemberId } = getPersistentMemberId(cookies)

        // Set cookie for new anonymous users
        if (isNewMemberId) {
            cookies.set("persistentMemberId", ownerId, {
                path: "/",
                domain: (new URL(env.PUBLIC_COOKIE_URL as string)).hostname,
                maxAge: 60 * 60 * 24 * 365 * 2, // 2 years
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax"
            })
        }

        const gameData = {
            name: gameName,
            settings: {
                individualsAllowed,
                newTeamsAllowed,
                spectatorsAllowed
            },
            teamNames,
            times: {
                tossup: [tossupTime, 2] as [number, number],
                bonus: [bonusTime, 2] as [number, number],
                visual: [visualTime, 2] as [number, number]
            },
            pointValues: {
                tossup: tossupPoints,
                bonus: bonusPoints,
                penalty: penaltyPoints
            },
            ownerId,
            tags: tags.length > 0 ? tags : undefined
        }
        
        const { game } = await createNewGame(ownerName, gameData)

        const gameToken = generateGameToken({ memberId: ownerId, gameId: game.id })
        cookies.set("gameToken", gameToken, {
            path: "/",
            domain: (new URL(env.PUBLIC_COOKIE_URL as string)).hostname
        })

        redirect(302, "/game/" + game.id)
    }
} satisfies Actions