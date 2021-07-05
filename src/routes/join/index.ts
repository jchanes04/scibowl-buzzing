import { Member } from "$lib/classes/Member";
import type { Request } from "@sveltejs/kit";
import type { ReadOnlyFormData } from "@sveltejs/kit/types/helper";
import { getGameFromCode } from "../../server";

export async function post(request: Request) {
    try {
        let formData = <ReadOnlyFormData>request.body
        let name = formData.get('name')
        let joinCode = formData.get('join-code')

        let game = getGameFromCode(joinCode)
        
        let newMember = new Member({ name })
        game.addMember(newMember)

        return {
            headers: {
                'Location': "/game/" + game.id,
                'Set-Cookie': "memberID=" + newMember.id
            },
            status: 302
        }
    } catch {
        return {
            headers: {
                'Location': "/error/invalid-join"
            },
            status: 302
        }
    }
}