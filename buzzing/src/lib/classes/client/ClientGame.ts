import type { Category, GameSettings, LastScoredQuestion } from "$lib/classes/Game"
import type { GameScoreboard } from "$lib/classes/GameScoreboard"
import type { ClientPlayer } from "$lib/classes/client/ClientPlayer"
import type { ClientTeam } from "$lib/classes/client/ClientTeam"

export interface ClientGame {
    id: string,
    joinCode: string,
    name: string,
    
    scoreboard: GameScoreboard

    moderators: ClientPlayer[],
    players: ClientPlayer[],
    teams: ClientTeam[],
    spectators: Set<string>

    settings: GameSettings

    times: { //times [client, server extratime]
        tossup: [number, number],
        bonus:  [number, number]
    }
        
    state: { // idle means no question open
        questionState: 'idle' | 'open' | 'buzzed'
        currentBuzzer: ClientPlayer | null,
        currentQuestion: {
            category: Category,
            bonus: boolean
        } | null
        buzzedTeams: ClientTeam[],
        lastScored: LastScoredQuestion | null
    }
}

export type ClientGameParameters = {
    id: string,
    name: string,
    joinCode: string,
    settings: GameSettings,
    times: {
        tossup: [number, number],
        bonus: [number, number]
    }
}

export class ClientGame {
    constructor({ id, name, joinCode, settings, times }: ClientGameParameters) {
        this.id = id,
        this.name = name,
        this.joinCode = joinCode,
        this.settings = settings,
        this.times = times

        this.state = {
            questionState: "idle",
            currentBuzzer: null,
            currentQuestion: null,
            buzzedTeams: [],
            lastScored: null
        }
    }
}