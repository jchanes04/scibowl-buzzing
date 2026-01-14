import { getDataFromGameToken } from "$lib/authentication"
import { getGame, io } from "$lib/server"
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { addChatMessage, getConvexClient, api } from "$lib/convex.server"

export const load = async function ({ params, locals, cookies }) {
    const { id } = params
    const game = getGame(id)

    if (!game)
        redirect(302, "/join")

    // Get game data from Convex
    const convex = getConvexClient()
    const gameData = await convex.query(api.games.get, { gameId: id })

    if (!gameData)
        redirect(302, "/join")

    const gameToken = cookies.get("gameToken")
    const tokenData = gameToken ? await getDataFromGameToken(gameToken) : null

    const memberId = tokenData?.memberId
    if (!memberId) {
        if (gameData.settings.spectatorsAllowed) {
            redirect(302, "/spectate/" + id)
        } else {
            redirect(302, "/join")
        }
    }

    const member = game.people[memberId]

    if (member) {
        const playerList = Object.fromEntries(
            Object.entries(game.players).map(([id, m]) => [id, m.data])
        )
        const teamList = Object.fromEntries(
            Object.entries(game.teams).map(([id, t]) => [id, t.data])
        )
        const moderatorList = Object.fromEntries(
            Object.entries(game.moderators).map(([id, m]) => [id, m.data])
        )

        return {
            gameInfo: {
                id,
                name: game.name,
                joinCode: game.joinCode,
                settings: game.settings,
                times: game.times
            },
            scores: game.scoreboard.scores,
            playerList,
            teamList,
            moderatorList,
            myMemberId: tokenData.memberId,
            currentGameState: {
                questionState: game.state.questionState,
                currentBuzzer: game.state.currentBuzzer?.data || null,
                currentQuestion: game.state.currentQuestion,
                buzzedTeamIds: Object.keys(game.state.buzzedTeams)
            }
        }
    } else if (game && memberId) {
        const rejoinedMember = game.rejoinMember(memberId)

        if (rejoinedMember?.type === "player") {
            // Reactivate in Convex
            const convex = getConvexClient()

            // Reactivate team if it was a created team
            if (rejoinedMember.team?.type === "created") {
                await convex.mutation(api.teams.add, {
                    gameId: id,
                    teamId: rejoinedMember.team.id,
                    name: rejoinedMember.team.name,
                    type: rejoinedMember.team.type
                })
            }

            // Reactivate member
            await convex.mutation(api.gameMembers.add, {
                gameId: id,
                memberId,
                name: rejoinedMember.name,
                type: "player",
                teamId: rejoinedMember.team?.id
            })

            io.to(id).emit('memberRejoin', {
                member: rejoinedMember.data,
                team: rejoinedMember.team.data
            })
            locals.myData = rejoinedMember.data

            // Add chat message for player rejoining
            await addChatMessage({
                gameId: id,
                text: `${rejoinedMember.name} has rejoined the game`,
                type: "notification"
            })

            const playerList = Object.fromEntries(
                Object.entries(game.players).map(([id, m]) => [id, m.data])
            )
            const teamList = Object.fromEntries(
                Object.entries(game.teams).map(([id, t]) => [id, t.data])
            )
            const moderatorList = Object.fromEntries(
                Object.entries(game.moderators).map(([id, m]) => [id, m.data])
            )

            return {
                gameInfo: {
                    id,
                    name: game.name,
                    joinCode: game.joinCode,
                    settings: game.settings,
                    times: game.times
                },
                scores: game.scoreboard.scores,
                playerList,
                teamList,
                moderatorList,
                myMemberId: tokenData.memberId,
                currentGameState: {
                    questionState: game.state.questionState,
                    currentBuzzer: game.state.currentBuzzer?.data || null,
                    currentQuestion: game.state.currentQuestion,
                    buzzedTeamIds: Object.keys(game.state.buzzedTeams)
                }
            }
        } else if (rejoinedMember?.type === "moderator") {
            // Reactivate moderator in Convex
            const convex = getConvexClient()
            await convex.mutation(api.gameMembers.add, {
                gameId: id,
                memberId,
                name: rejoinedMember.name,
                type: "moderator"
            })

            io.to(id).emit("memberRejoin", {
                member: rejoinedMember.data
            })

            // Add chat message for moderator rejoining
            await addChatMessage({
                gameId: id,
                text: `${rejoinedMember.name} has rejoined the game`,
                type: "notification"
            })

            const playerList = Object.fromEntries(
                Object.entries(game.players).map(([id, m]) => [id, m.data])
            )
            const teamList = Object.fromEntries(
                Object.entries(game.teams).map(([id, t]) => [id, t.data])
            )
            const moderatorList = Object.fromEntries(
                Object.entries(game.moderators).map(([id, m]) => [id, m.data])
            )

            return {
                gameInfo: {
                    id,
                    name: game.name,
                    joinCode: game.joinCode,
                    settings: game.settings,
                    times: game.times
                },
                scores: game.scoreboard.scores,
                playerList,
                teamList,
                moderatorList,
                myMemberId: tokenData.memberId,
                currentGameState: {
                    questionState: game.state.questionState,
                    currentBuzzer: game.state.currentBuzzer?.data || null,
                    currentQuestion: game.state.currentQuestion,
                    buzzedTeamIds: Object.keys(game.state.buzzedTeams)
                }
            }
        } else if (game.settings.spectatorsAllowed) {
            redirect(302, "/spectate/" + id)
        } else {
            redirect(302, "/join/" + id)
        }
    } else {
        redirect(302, "/join")
    }
} satisfies PageServerLoad
