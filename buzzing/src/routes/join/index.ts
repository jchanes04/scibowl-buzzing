import { Member } from "$lib/classes/Member";
import { Team } from "$lib/classes/Team";
import type { Request } from "@sveltejs/kit";
import type { ReadOnlyFormData } from "@sveltejs/kit/types/helper";
import { getGameFromCode, getGame } from "../../server";
import { redirectTo } from "$lib/functions/redirectTo";
import { io } from '../../server'

export async function post(request: Request) {
    try {
        const formData = <ReadOnlyFormData>request.body
        const name = formData.get('name')
        const joinCode = formData.get('join-code')
        const gameID = formData.get('gameID')

        const game = joinCode ? getGameFromCode(joinCode) : getGame(gameID)

        if (joinCode && game) {
            return redirectTo('/join/' + game.id)
        } else if (game) {
            const { teamFormat } = game
            if (teamFormat === "individuals") {
                var newMember = new Member({ name, reader: false })
            } else if (teamFormat === "teams") {
                const teamID = formData.get('team-id')
                const team = <Team>game.teams.find(t => t.id === teamID)

                var newMember = new Member({ name, team, reader: false })
            } else if (teamFormat === "any") {
                const teamOrIndiv = formData.get('team-or-indiv')

                if (teamOrIndiv === "indiv") {
                    var newMember = new Member({ name, reader: false })
                } else if (teamOrIndiv === "team") {
                    const teamID = formData.get('team-id')
                    const team = <Team>game.teams.find(t => t.id === teamID)

                    var newMember = new Member({ name, team, reader: false })
                } else if (teamOrIndiv === "new-team") {
                    const teamName = formData.get('new-team-name')
                    const team = new Team(teamName)
                    
                    var newMember = new Member({ name, team, reader: false })
                }
            }

            game.addMember(newMember)
                
            io.to(game.id).emit('memberJoin', { member: newMember.self, team: newMember.team.self })
            game.addChatMessage({
                text: newMember.name + ' has joined the game',
                type: 'notification'
            })
    
            return {
                headers: {
                    'Location': "/game/" + game.id,
                    'Set-Cookie': "memberID=" + newMember.id + "; Max-Age=3600"
                },
                status: 302
            }

        } else {
            return redirectTo('/error/invalid-code')
        }
    } catch (e) {
        console.error(e)
        return redirectTo('/error/invalid-join')
    }
}
