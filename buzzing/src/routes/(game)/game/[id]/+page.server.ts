import { getDataFromGameToken } from "$lib/authentication"
import { getGame, io } from "$lib/server"
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

export const load = async function({ params, locals, cookies }) {
    const { id } = params
    const game = getGame(id)

    if (!game)
        throw redirect(302, "/join")

    const gameToken = cookies.get("gameToken")
    const tokenData = gameToken ? await getDataFromGameToken(gameToken) : null

    const memberId = tokenData?.memberId
    if (!memberId) {
        if (game.settings.spectatorsAllowed) {
            throw redirect(302, "/spectate/" + id)
        } else {
            throw redirect(302, "/join")
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
            myMemberId: tokenData.memberId
        }
    } else if (game && memberId) {
        const rejoinedMember = game.rejoinMember(memberId)
        
        if (rejoinedMember?.type === "player") {
            io.to(id).emit('memberRejoin', {
                member: rejoinedMember.data,
                team: rejoinedMember.team.data
            })
            locals.myData = rejoinedMember.data
            
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
                myMemberId: tokenData.memberId
            }
        } else if (rejoinedMember?.type === "moderator") {
            io.to(id).emit("memberRejoin", {
                member: rejoinedMember.data
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
                myMemberId: tokenData.memberId
            }
        } else if (game.settings.spectatorsAllowed) {
            throw redirect(302, "/spectate/" + id)
        } else {
            throw redirect(302, "/join/" + id)
        }
    } else {
        throw redirect(302, "/join")
    }
} satisfies PageServerLoad
