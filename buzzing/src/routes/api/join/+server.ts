import { Member } from "$lib/classes/Member";
import { Team } from "$lib/classes/Team";
import type { RequestHandler } from "./$types";
import { redirectTo } from "$lib/functions/redirectTo";
import { io, getGameFromCode, getGame } from '$lib/server'
import { generateToken } from "$lib/authentication";
import { redirect } from "@sveltejs/kit";

export const POST = async function({ request, cookies }) {
    try {
        const body: FormData = await request.formData()
        const joinCode = body.get('join-code') as string
        const gameId = body.get('gameId') as string
        const game = joinCode ? getGameFromCode(joinCode) : getGame(gameId)

        if (joinCode && game) {
            throw redirect(302, `/join/${game.id}?code=${game.joinCode}`)
        } else if (game) {
            const name = body.get('name') as string
            const teamOrIndiv = body.get('team-or-indiv')
        
            let newMember: Member
            if (teamOrIndiv == 'indiv'){
                newMember = new Member({ name, moderator: false })
            } else if (teamOrIndiv == 'team') {
                const teamID = body.get('team-id')
                const team = game.teams.find(t => t.id === teamID)
                newMember = new Member({ name, team, moderator: false })
            } else if (teamOrIndiv == 'new-team') {
                const teamName = body.get('new-team-name') as string
                const team = new Team(teamName)
                newMember = new Member({ name, team, moderator: false })
            }
            game.addMember(newMember)
                
            io.to(game.id).emit('memberJoin', { member: newMember.data, team: newMember.team.data })
    
            const authToken = generateToken({ memberId: newMember.id, gameId: game.id }, '6h')
            cookies.set("authToken", authToken, {
                path: "/",
                domain: (import.meta.env.VITE_HOST_URL as string)
                    .replace(/https?:\/\//, "").replace(/:[0-9]{1,4}/, "")
            })
            throw redirect(302, "/game/" + game.id)
        } else {
            throw redirect(302, "/error/invalid-code")
        }
    } catch (e) {
        console.error(e)
        throw redirect(302, "/error/invalid-join")        
    }
} satisfies RequestHandler
