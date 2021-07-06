import type { Request } from "@sveltejs/kit";
import { getGame } from "../../../server";

export function get({ params }: Request) {
    let { id } = params

    let game = getGame(id)

    let memberList = game.members

    return {
        body: {
            memberList,
            gameName: game.name,
            chatMessages: game.chatMessages.map(x => { return {...x} })
        }
    }
}