import { createMemberID } from "$lib/functions/createId";
import type { Socket } from "socket.io";
import { IndividualTeam } from "./IndividualTeam";
import { MemberScoreboard } from "./MemberScoreboard";
import type { Team } from "./Team";

export interface Member {
    name: string,
    id: string,
    team: Team | IndividualTeam,
    reader: boolean,
    scoreboard: MemberScoreboard,
    socket?: Socket
}

export interface MemberClean {
    name: string,
    id: string,
    reader: boolean,
    teamID: string,
    scoreboard: MemberScoreboard,
    socket?: Socket
}

export class Member {
    constructor({ name, team, reader }: { name: string, team?: Team, reader: boolean }) {
        this.id = createMemberID()
        this.name = name
        this.reader = reader
        this.scoreboard = new MemberScoreboard(team?.scoreboard)
        this.team = team || new IndividualTeam(this.id, this)
        if (team) team.addMember(this)
    }

    setSocket(socket: Socket) {
        this.socket = socket
    }

    get self(): MemberClean {
        return {
            name: this.name,
            id: this.id,
            reader: this.reader,
            scoreboard: this.scoreboard,
            socket: this.socket,
            teamID: this.team.id
        }
    }
}