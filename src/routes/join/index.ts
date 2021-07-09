import { Member } from "$lib/classes/Member";
import type { Request } from "@sveltejs/kit";
import type { ReadOnlyFormData } from "@sveltejs/kit/types/helper";
import { getGameFromCode, getGame } from "../../server";
import { redirectTo } from "$lib/functions/redirectTo";
import { io } from '../../server'

export async function post(request: Request) {
    try {
        let formData = <ReadOnlyFormData>request.body
        let name = formData.get('name')
        let joinCode = formData.get('join-code')
        let gameID = formData.get('gameID')

        let game = joinCode ? getGameFromCode(joinCode) : getGame(gameID)
        
        let newMember = new Member({ name })
        game.addMember(newMember)
        io.to(game.id).emit('memberJoin', { member: newMember.self, team: newMember.team.self })
        game.addChatMessage({
            text: newMember.name + ' has joined',
            type: 'notification'
        })

        return {
            headers: {
                'Location': "/game/" + game.id,
                'Set-Cookie': "memberID=" + newMember.id
            },
            status: 302
        }
    } catch (e) {
        console.error(e)
        return redirectTo('/error/invalid-join')
    }
}
