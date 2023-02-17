import { Scoreboard } from "$lib/classes/Scoreboard";
import type { PlayerData } from "$lib/classes/Player";
import type { TeamStore } from "$lib/stores/teams";

export interface ClientPlayer {
    name: string,
    id: string,
    type: "player",
    team: TeamStore,
    scoreboard: Scoreboard | null,
}

export class ClientPlayer {
    constructor({ name, id, scoreboard }: PlayerData, teamStore: TeamStore) {
        this.name = name,
        this.id = id,
        this.type = "player"
        this.team = teamStore
        this.scoreboard = scoreboard ? new Scoreboard({
            teamScoreboard: new Scoreboard({}),
            score: scoreboard.score,
            catScores: scoreboard.catScores
        }) : null
    }
}