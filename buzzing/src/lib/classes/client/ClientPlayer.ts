import type { PlayerData } from "$lib/classes/Player";
import type { ClientTeamData } from "$lib/stores/members.svelte";

export interface ClientPlayer {
    name: string,
    id: string,
    type: "player",
    team: ClientTeamData,
}

export class ClientPlayer {
    constructor({ name, id }: PlayerData, teamStore: ClientTeamData) {
        this.name = name,
        this.id = id,
        this.type = "player"
        this.team = teamStore
    }

    rename(name: string) {
        this.name = name
    }
}