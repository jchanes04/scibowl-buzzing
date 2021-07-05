import { createMemberID } from "$lib/functions/createId";
import type { Socket } from "socket.io";
import { MemberScoreboard } from "./MemberScoreboard";
import type { Team } from "./Team";

export interface Member {
    name: string,
    id: string,
    team: Team,
    scoreboard: MemberScoreboard,
    socket?: Socket
}

export class Member {
    constructor({ name, team }: { name: string, team?: Team }) {
        this.id = createMemberID()
        this.name = name
        this.team = team || null
        this.scoreboard = new MemberScoreboard(team?.scoreboard)
    }

    setSocket(socket: Socket) {
        this.socket = socket
    }
}