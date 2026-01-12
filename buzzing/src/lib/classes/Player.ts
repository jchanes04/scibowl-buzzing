import { createMemberID } from "$lib/functions/createId";
import type { Socket } from "socket.io";
import type { Team, TeamData } from "./Team";

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
    isCaptain: boolean,
    team?: Omit<TeamData, 'players'>, // Use Omit to break recursion
    connected: boolean
}

interface PlayerParameters {
    name: string,
    id: string,
    team?: Team,
    connected?: boolean,
    isCaptain?: boolean // Added for completeness with the class
}

export class Player {
    name: string
    id: string
    isCaptain: boolean
    team: Team
    connected: boolean
    socket?: Socket // Retaining socket property from original Player interface

    constructor({ name, id, team, connected, isCaptain }: Partial<PlayerParameters>) {
        this.name = name || "New Player"
        this.id = id || createMemberID() // Using createMemberID for default ID
        this.team = team as Team // Assuming team will be set or handled externally if not provided
        this.isCaptain = isCaptain ?? false // Defaulting to false
        this.connected = connected ?? true // Defaulting to true
        this.type = "player" // Retaining type property from original Player interface
    }

    // Retaining setSocket and rename methods from original class
    setSocket(socket: Socket) {
        this.socket = socket
    }

    rename(name: string) {
        this.name = name
    }

    get data(): PlayerData {
        return {
            name: this.name,
            id: this.id,
            type: "player",
            isCaptain: this.isCaptain,
            team: this.team ? {
                id: this.team.id,
                name: this.team.name,
                captainId: this.team.captainId,
                type: this.team.type
            } : undefined,
            connected: this.connected
        }
    }
}