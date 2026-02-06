import { getDataFromGameToken } from "$lib/authentication"
import { getGame } from "$lib/server"
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import type { BuzzerData, Game } from "$lib/classes/Game"
import type { ClientGameData } from "$lib/stores/game.svelte"

export const load = async function ({ params, cookies }) {
    const { id: gameId } = params
    const game = await getGame(gameId)

    if (!game)
        redirect(302, "/join")

    const gameToken = cookies.get("gameToken")
    const tokenResult = gameToken ? await getDataFromGameToken(gameToken) : null

    const memberId = tokenResult?.isOk() ? tokenResult.value.memberId : undefined
    if (!memberId) {
        if (game.settings.spectatorsAllowed) {
            redirect(302, "/spectate/" + gameId)
        } else {
            redirect(302, "/join")
        }
    }

    // Check if member is in in-memory game state
    const member = game.people[memberId]

    if (member) {
        return buildPageData(game, gameId, memberId)
    }

    // Member not found in-memory - they need to re-join via join page
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
