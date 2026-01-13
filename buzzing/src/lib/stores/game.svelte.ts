import type { GameSettings, GameTimes, NewQuestionData, Question } from "$lib/classes/Game";
import type { ClientPlayer } from "./players.svelte";

type BuzzedState = {
    questionState: "buzzed",
    currentBuzzer: ClientPlayer,
    currentQuestion: NewQuestionData,
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
    currentQuestion: NewQuestionData,
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

let gameData = $state<ClientGameData>({
    id: "",
    name: "",
    settings: {
        individualsAllowed: false,
        newTeamsAllowed: true,
        spectatorsAllowed: false
    },
    times: {
        tossup: [5, 2],
        bonus: [20, 2],
        visual: [30, 2]
    },
    state: {
        questionState: "idle",
        currentBuzzer: null,
        currentQuestion: null,
        buzzingEnabled: false,
        buzzedTeamIds: []
    }
})

export default {
    get value() {
        return gameData;
    },
    set: (value: ClientGameData) => {
        gameData = value;
    },
    disableBuzzing: () => {
        gameData.state.buzzingEnabled = false
    },
    enableBuzzing: () => {
        gameData.state.buzzingEnabled = true
    },
    buzz: (teamId: string, player: ClientPlayer) => {
        gameData.state.buzzingEnabled = false
        gameData.state.buzzedTeamIds.push(teamId)
        gameData.state = {
            ...gameData.state,
            questionState: "buzzed",
            currentBuzzer: player,
            buzzingEnabled: false,
            buzzedTeamIds: gameData.state.buzzedTeamIds
        } as BuzzedState
    },
    removeTeamBuzz: (teamId: string) => {
        gameData.state.buzzedTeamIds = gameData.state.buzzedTeamIds.filter(x => x !== teamId)
    },
    openQuestion: (buzzingEnabled: boolean) => {
        gameData.state = {
            ...gameData.state,
            questionState: "open",
            currentBuzzer: null,
            buzzingEnabled
        } as OpenState
    },
    stopQuestion: () => {
        gameData.state.buzzingEnabled = false
    },
    clearQuestion: () => {
        gameData.state = {
            questionState: "idle",
            currentBuzzer: null,
            currentQuestion: null,
            buzzingEnabled: false,
            buzzedTeamIds: []
        }
    },
    newQuestion: (questionData: NewQuestionData, buzzingEnabled: boolean) => {
        gameData.state = {
            questionState: "open",
            currentQuestion: questionData,
            currentBuzzer: null,
            buzzingEnabled,
            buzzedTeamIds: []
        }
    },
}