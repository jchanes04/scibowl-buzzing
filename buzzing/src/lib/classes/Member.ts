import { createMemberID } from "$lib/functions/createId";
import type { Socket } from "socket.io";
import { catScores, Scoreboard, ScoreboardData } from "./Scoreboard";
import { Team } from "./Team";

export interface Member {
    name: string,
    id: string,
    team?: Team,
    moderator: boolean,
    scoreboard: Scoreboard,
    socket?: Socket
}

export interface MemberData {
    name: string,
    id: string,
    moderator: boolean,
    teamID: string,
    scoreboard: ScoreboardData
}

export class Member {
    constructor({ name, id, team, moderator, score, catScores }: { name: string, id?: string, team?: Team, moderator: boolean, score?: number, catScores?: catScores }) {
        this.id = id || createMemberID() 
        this.name = name
        this.moderator = moderator
        this.scoreboard = new Scoreboard({ teamScoreboard: team?.scoreboard, score, catScores })
        this.team = team || (moderator ? null : new Team(this.id, true, [this]))
        if (team) team.addMember(this)
    }

    setSocket(socket: Socket) {
        this.socket = socket
    }

    get data(): MemberData {
        return {
            name: this.name,
            id: this.id,
            moderator: this.moderator,
            scoreboard: this.scoreboard.data,
            teamID: this.team?.id ?? null
        }
    }

    promote() {
        this.moderator = true
    }
}