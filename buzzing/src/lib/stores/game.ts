import type { Category, GameSettings, GameTimes, Question } from "$lib/classes/Game";
import { writable, type Writable } from "svelte/store";
import type { PlayerStore } from "./players";

type BuzzedState = {
    questionState: "buzzed",
    currentBuzzer: PlayerStore,
    currentQuestion: Question,
    buzzingEnabled: false,
    buzzedTeamIds: string[]
}

type IdleState = {
    questionState: "idle",
    currentBuzzer: null,
    currentQuestion: null,
    buzzingEnabled: false,
    buzzedTeamIds: string[]
}

type OpenState = {
    questionState: "open",
    currentBuzzer: null,
    currentQuestion: Question,
    buzzingEnabled: boolean,
    buzzedTeamIds: string[]
}

type ClientGameState = OpenState | IdleState | BuzzedState

export type ClientGameData = {
    id: string,
    name: string,
    joinCode?: string,
    settings: GameSettings,
    times: GameTimes,
    state: ClientGameState
}

const store = writable<ClientGameData>()

export default {
    subscribe: store.subscribe,
    set: store.set,
    disableBuzzing: () => {
        store.update(value => {
            value.state.buzzingEnabled = false
            return value
        })
    },
    enableBuzzing: () => {
        store.update(value => {
            value.state.buzzingEnabled = true
            return value
        })
    },
    buzz: (teamId: string) => {
        store.update(value => {
            value.state.buzzingEnabled = false
            value.state.buzzedTeamIds.push(teamId)
            value.state.questionState = "buzzed"
            return value
        })
    },
    openQuestion: (buzzingEnabled: boolean) => {
        store.update(value => {
            value.state.questionState = "open"
            value.state.buzzingEnabled = buzzingEnabled
            return value
        })
    },
    stopQuestion: () => {
        store.update(value => {
            value.state.questionState = "open"
            value.state.buzzingEnabled = false
            return value
        })
    },
    clearQuestion: () => {
        store.update(value => {
            value.state.buzzingEnabled = false
            value.state.buzzedTeamIds = []
            value.state.questionState = "idle"
            return value
        })
    },
    newQuestion: (questionData: Question, buzzingEnabled: boolean) => {
        store.update(value => {
            value.state = {
                questionState: "open",
                currentQuestion: questionData,
                currentBuzzer: null,
                buzzingEnabled,
                buzzedTeamIds: []
            }
            return value
        })
    }
}