import { createTeamID } from "$lib/functions/createId";
import type { Player, PlayerData } from "./Player";

export type TeamType = "default" | "created" | "individual"

export interface Team {
    id: string,
    name: string,
    players: Record<string, Player>,
    captainId: string | null,
    type: TeamType
}

export interface TeamData {
    id: string,
    name: string,
    players: Record<string, PlayerData>,
    captainId: string | null,
    type: TeamType
}

export class Team {
    constructor(name: string, type: TeamType = "default", players: Player[] = []) {
        this.id = createTeamID()
        this.name = name
        this.players = Object.fromEntries(players.map(p => [p.id, p]))
        this.captainId = null
        this.type = type
    }

    addPlayer(player: Player) {
        this.players[player.id] = player
    }

    removePlayer(id: string) {
        const player = this.players[id]
        delete this.players[id]
        return player ?? null
    }

    get data(): TeamData {
        return {
            id: this.id,
            name: this.name,
            players: Object.fromEntries(
                Object.entries(this.players).map(([id, p]) => [id, p.data])
            ),
            captainId: this.captainId,
            type: this.type
        }
    }
}