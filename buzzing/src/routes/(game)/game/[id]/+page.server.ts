import { getDataFromGameToken } from "$lib/authentication"
import { getGame } from "$lib/server"
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { getConvexClient, api } from "$lib/convex.server"
import type { BuzzerData, Game } from "$lib/classes/Game"
import type { ClientGameData } from "$lib/stores/game.svelte"

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


    let currentGameState: ClientGameData['state'];

    if (game.state.questionState === "buzzed" && game.state.currentQuestion && game.state.currentBuzzer) {
        currentGameState = {
            questionState: "buzzed",
            currentBuzzer: game.state.currentBuzzer,
            currentQuestion: game.state.currentQuestion,
            buzzingEnabled: false,
            buzzedTeamIds: Array.from(game.state.buzzedTeamIds),
        };
    } else if (game.state.questionState === "open" && game.state.currentQuestion) {
        currentGameState = {
            questionState: "open",
            currentBuzzer: null,
            currentQuestion: game.state.currentQuestion,
            buzzingEnabled: true,
            buzzedTeamIds: Array.from(game.state.buzzedTeamIds),
        };
    } else {
        currentGameState = {
            questionState: "idle",
            currentBuzzer: null,
            currentQuestion: null,
            buzzingEnabled: false,
            buzzedTeamIds: [],
        };
    }


    return {
        gameInfo: {
            id: gameId,
            name: game.name,
            joinCode: game.joinCode,
            settings: game.settings,
            times: game.times,
            state: currentGameState
        },
        myMemberId,
        chatHistory: game.getChatMessagesForMember(myMemberId)
    }
}
