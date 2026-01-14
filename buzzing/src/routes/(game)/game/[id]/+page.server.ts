import { getDataFromGameToken } from "$lib/authentication"
import { getGame, io } from "$lib/server"
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { addChatMessage, getConvexClient, api } from "$lib/convex.server"

export const load = async function ({ params, cookies }) {
    const { id: gameId } = params
    const game = getGame(gameId)

    if (!game)
        redirect(302, "/join")

    const gameToken = cookies.get("gameToken")
    const tokenData = gameToken ? await getDataFromGameToken(gameToken) : null

    const memberId = tokenData?.memberId
    if (!memberId) {
        if (game.settings.spectatorsAllowed) {
            redirect(302, "/spectate/" + gameId)
        } else {
            redirect(302, "/join")
        }
    }

    // Check if member is active in cache
    const member = game.people[memberId]

    if (member) {
        // Member is active - just return the data
        return buildPageData(game, gameId, memberId)
    }

    // Member not in active cache - check Convex for inactive member
    const convex = getConvexClient()
    const allMembers = await convex.query(api.gameMembers.getAllForGame, { gameId })
    const inactiveMember = allMembers.find(m => m.id === memberId && !m.isActive)

    if (inactiveMember) {
        // Reactivate the member in Convex
        await convex.mutation(api.gameMembers.add, {
            gameId,
            memberId,
            name: inactiveMember.name,
            type: inactiveMember.type,
            teamId: inactiveMember.teamId
        })

        // If it's a player with a created/individual team, reactivate the team too
        if (inactiveMember.type === "player" && inactiveMember.teamId) {
            const allTeams = await convex.query(api.teams.getAllForGame, { gameId })
            const inactiveTeam = allTeams.find(t => t.teamId === inactiveMember.teamId && !t.isActive)
            if (inactiveTeam) {
                await convex.mutation(api.teams.add, {
                    gameId,
                    teamId: inactiveTeam.teamId,
                    name: inactiveTeam.name,
                    type: inactiveTeam.type,
                    captainId: inactiveTeam.captainId
                })
            }
        }

        // Emit socket event for others
        const memberData = {
            id: memberId,
            name: inactiveMember.name,
            type: inactiveMember.type,
            teamID: inactiveMember.teamId
        }

        if (inactiveMember.type === "player" && inactiveMember.teamId) {
            const team = game.teams[inactiveMember.teamId]
            io.to(gameId).emit('memberRejoin', {
                member: memberData,
                team: team ? { id: team.id, name: team.name, type: team.type, captainId: team.captainId } : null
            })
        } else {
            io.to(gameId).emit('memberRejoin', {
                member: memberData
            })
        }

        // Add chat message
        await addChatMessage({
            gameId,
            text: `${inactiveMember.name} has rejoined the game`,
            type: "notification"
        })

        return buildPageData(game, gameId, memberId)
    }

    // Member not found at all - redirect
    if (game.settings.spectatorsAllowed) {
        redirect(302, "/spectate/" + gameId)
    } else {
        redirect(302, "/join/" + gameId)
    }
} satisfies PageServerLoad

function buildPageData(game: ReturnType<typeof getGame>, gameId: string, myMemberId: string) {
    if (!game) throw new Error("Game not found")

    // Build player list from cache
    const playerList = Object.fromEntries(
        Object.entries(game.players).map(([id, m]) => [id, {
            id: m.id,
            name: m.name,
            type: "player" as const,
            teamID: m.teamId
        }])
    )

    // Build team list from cache
    const teamList = Object.fromEntries(
        Object.entries(game.teams).map(([id, t]) => [id, {
            id: t.id,
            name: t.name,
            type: t.type,
            captainId: t.captainId ?? null
        }])
    )

    // Build moderator list from cache
    const moderatorList = Object.fromEntries(
        Object.entries(game.moderators).map(([id, m]) => [id, {
            id: m.id,
            name: m.name,
            type: "moderator" as const
        }])
    )

    // Build current buzzer data
    const currentBuzzer = game.state.currentBuzzer
        ? {
            id: game.state.currentBuzzer.id,
            name: game.state.currentBuzzer.name,
            teamId: game.state.currentBuzzer.teamId
        }
        : null

    return {
        gameInfo: {
            id: gameId,
            name: game.name,
            joinCode: game.joinCode,
            settings: game.settings,
            times: game.times
        },
        playerList,
        teamList,
        moderatorList,
        myMemberId,
        currentGameState: {
            questionState: game.state.questionState,
            currentBuzzer,
            currentQuestion: game.state.currentQuestion,
            buzzedTeamIds: Array.from(game.state.buzzedTeamIds)
        }
    }
}
