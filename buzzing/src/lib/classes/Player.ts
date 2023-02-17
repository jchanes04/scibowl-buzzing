import { createMemberID } from "$lib/functions/createId";
import type { Socket } from "socket.io";
import { type catScores, Scoreboard, type ScoreboardData } from "./Scoreboard";
import { Team } from "./Team";

export interface Player {
    name: string,
    id: string,
    type: "player",
    team: Team,
    scoreboard: Scoreboard,
    socket?: Socket
}

export interface PlayerData {
    name: string,
    id: string,
    type: "player",
    teamID: string,
    scoreboard: ScoreboardData
}

export class Player {
    constructor({ name, id, team, score, catScores }: { name: string, id?: string, team?: Team, score?: number, catScores?: catScores }) {
        this.id = id || createMemberID() 
        this.name = name
        this.type = "player"
        this.scoreboard = new Scoreboard({ teamScoreboard: team?.scoreboard, score, catScores })
        this.team = team || new Team(this.name, "individual", [this])
        if (team) team.addPlayer(this)
    }

    setSocket(socket: Socket) {
        this.socket = socket
    }

    get data(): PlayerData {
        return {
            name: this.name,
            id: this.id,
            type: "player",
            scoreboard: this.scoreboard?.data || null,
            teamID: this.team?.id ?? null
        }
    }
}