import type { Request } from "@sveltejs/kit";
import { getGame } from "../../../server";

export function get({ params }: Request) {
    let { id } = params

    let game = getGame(id)

    let memberList = game.members.map(m => m.self)
    let teamList = game.teams.map(x => x.self)
    console.log("team list:")
    console.dir(teamList)

    return {
        body: {
            memberList,
            teamList,
            gameName: game.name,
            joinCode: game.joinCode,
            chatMessages: game.chatMessages.map(x => { return {...x} })
        }
    }
}