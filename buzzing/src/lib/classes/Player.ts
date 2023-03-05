import { createMemberID } from "$lib/functions/createId";
import type { Socket } from "socket.io";
import { Team } from "./Team";

export interface Player {
    name: string,
    id: string,
    type: "player",
    team: Team,
    socket?: Socket
}

export interface PlayerData {
    name: string,
    id: string,
    type: "player",
    teamID: string,
}

export class Player {
    constructor({ name, id, team }: { name: string, id?: string, team?: Team }) {
        this.id = id || createMemberID() 
        this.name = name
        this.type = "player"
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
            teamID: this.team?.id ?? null
        }
    }
}