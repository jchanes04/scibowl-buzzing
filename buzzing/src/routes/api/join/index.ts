import { Member } from "$lib/classes/Member";
import { Team } from "$lib/classes/Team";
import type { RequestEvent } from "@sveltejs/kit";
import { redirectTo } from "$lib/functions/redirectTo";
import { io, getGameFromCode, getGame } from '$lib/server'
import { generateToken } from "$lib/authentication";

export async function post({ request }: RequestEvent) {
    try {
        const body = await request.formData()
        const joinCode = body.get('join-code') as string
        const gameID = body.get('gameID') as string
        const game = joinCode ? getGameFromCode(joinCode) : getGame(gameID)
        console.dir(game)
        console.log(joinCode)
        if (joinCode && game) {
            return redirectTo('/join/' + game.id)
        } else if (game) {
            const name = body.get('name') as string
            const teamOrIndiv = body.get('team-or-indiv')
        
            let newMember: Member
            console.log(teamOrIndiv)

            if (teamOrIndiv == 'indiv'){
                newMember = new Member({ name, moderator: false })
            } else if (teamOrIndiv == 'team') {

                const teamID = body.get('team-id')
                console.log(teamID)
                const team = game.teams.find(t => t.id === teamID)
                console.dir(team)
                newMember = new Member({ name, team, moderator: false })
            } else if (teamOrIndiv == 'new-team') {
                const teamName = body.get('new-team-name') as string
                const team = new Team(teamName)
                newMember = new Member({ name, team, moderator: false })
            }
            console.dir(newMember)
            game.addMember(newMember)
                
            io.to(game.id).emit('memberJoin', { member: newMember.data, team: newMember.team.data })
    
            const authToken = generateToken({ memberId: newMember.id, gameId: game.id }, '6h')
            return {
                headers: {
                    'Location': "/game/" + game.id,
                    'Set-Cookie': "authToken=" + authToken + ";Path=/"
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
