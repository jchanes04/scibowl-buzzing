import { getDataFromGameToken } from "$lib/authentication"
import { getGame } from "$lib/server"
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import type { BuzzerData, Game } from "$lib/classes/Game"
import type { ClientGameState } from "$lib/stores/game.svelte"

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
    const member = game.members[memberId]

    if (member) {
        return {
            gameInfo: {
                id: gameId,
                name: game.name,
                joinCode: game.joinCode,
                settings: game.settings,
                times: game.times,
                state: {
                    ...game.state, 
                    buzzingEnabled: game.state.questionState === "open" 
                        ? game.state.buzzedTeamIds.has(member.teamId || "") 
                        : false  
                } 
            },
            memberId,
            chatHistory: game.getChatMessagesForMember(memberId)
        }
    }

    // Member not found in-memory - they need to re-join via join page
    if (game.settings.spectatorsAllowed) {
        redirect(302, "/spectate/" + gameId)
    } else {
        redirect(302, "/join/" + gameId)
    }
} satisfies PageServerLoad

