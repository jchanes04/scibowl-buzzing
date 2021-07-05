import type { Request } from "@sveltejs/kit";
import { getGame } from "../../../server";

export function get({ params }: Request) {
    let { id } = params

    let game = getGame(id)

    let memberNames = game.members.map(x => x.name)

    return {
        body: {
            memberNames,
            gameName: game.name
        }
    }
}