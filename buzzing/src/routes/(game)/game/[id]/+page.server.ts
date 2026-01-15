import { getDataFromGameToken } from "$lib/authentication"
import { getGame, io } from "$lib/server"
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { addChatMessage, getConvexClient, api } from "$lib/convex.server"
import type { Game } from "$lib/classes/Game"

export const load = async function ({ params, cookies }) {
    const { id: gameId } = params
    const game = await getGame(gameId)

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
    const convex = getConvexClient()

    if (!member) {
        // Member not in active cache - check Convex for inactive member
        const allMembers = await convex.query(api.gameMembers.getAllForGame, { gameId })
        const member = allMembers.find(m => m.id === memberId)    
    } 

    
    if (member) {
        await convex.mutation(api.gameMembers.rejoin, {
            gameId,
            memberId
        })

        // If it's a player with a created/individual team, reactivate the team too
        if (member.type === "player" && member.teamId) {
            const allTeams = await convex.query(api.teams.getAllForGame, { gameId })
            const inactiveTeam = allTeams.find(t => t.teamId === member.teamId && !t.isActive)
            if (inactiveTeam) {
                await convex.mutation(api.teams.rejoin, {
                    gameId,
                    teamId: member.teamId
                })
            }
        }

        return buildPageData(game, gameId, memberId)
    }

    // Member not found at all - redirect
    if (game.settings.spectatorsAllowed) {
        redirect(302, "/spectate/" + gameId)
    } else {
        redirect(302, "/join/" + gameId)
    }
} satisfies PageServerLoad

function buildPageData(game: Game | null, gameId: string, myMemberId: string) {
    if (!game) throw new Error("Game not found")

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
        myMemberId,
        currentGameState: {
            questionState: game.state.questionState,
            currentBuzzer,
            currentQuestion: game.state.currentQuestion,
            buzzedTeamIds: Array.from(game.state.buzzedTeamIds)
        }
    }
}
