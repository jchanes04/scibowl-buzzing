import type { PlayerData } from "$lib/classes/Player";
import type { TeamStore } from "$lib/stores/teams";

export interface ClientPlayer {
    name: string,
    id: string,
    type: "player",
    team: TeamStore,
}

export class ClientPlayer {
    constructor({ name, id }: PlayerData, teamStore: TeamStore) {
        this.name = name,
        this.id = id,
        this.type = "player"
        this.team = teamStore
    }

    rename(name: string) {
        this.name = name
    }
}