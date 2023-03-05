import type { Category, GameSettings, GameTimes, NewQuestionData, Question } from "$lib/classes/Game";
import { GameScoreboard, type QuestionPairScore } from "$lib/classes/GameScoreboard";
import { writable, type Writable } from "svelte/store";
import type { PlayerStore } from "./players";

type BuzzedState = {
    questionState: "buzzed",
    currentBuzzer: PlayerStore,
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
    state: ClientGameState,
    scores: Record<number, QuestionPairScore>
}

const store = writable<ClientGameData>()
let scoreboard = new GameScoreboard({})

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
    newQuestion: (questionData: NewQuestionData, buzzingEnabled: boolean) => {
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
    },
    scoreboard: {
        correctTossup: (number: number, playerId: string, teamId: string, category: Category) => {
            scoreboard.correctTossup(
                number,
                playerId,
                teamId,
                category
            )
            console.log(scoreboard.scores)
            store.update(value => {
                value.scores = scoreboard.scores
                return value
            })
        },
        incorrectTossup: (number: number, playerId: string, teamId: string, category: Category) => {
            scoreboard.incorrectTossup(
                number,
                playerId,
                teamId,
                category
            )
            store.update(value => {
                value.scores = scoreboard.scores
                return value
            })
        },
        penalty: (number: number, playerId: string, teamId: string, category: Category) => {
            scoreboard.penalty(
                number,
                playerId,
                teamId,
                category
            )
            store.update(value => {
                value.scores = scoreboard.scores
                return value
            })
        },
        correctBonus: (number: number, teamId: string, category: Category) => {
            scoreboard.correctBonus(
                number,
                teamId,
                category
            )
            store.update(value => {
                value.scores = scoreboard.scores
                return value
            })
        },
        incorrectBonus: (number: number, teamId: string, category: Category) => {
            scoreboard.incorrectBonus(
                number,
                teamId,
                category
            )
            store.update(value => {
                value.scores = scoreboard.scores
                return value
            })
        },
        clear: () => {
            scoreboard = new GameScoreboard()
            store.update(value => {
                value.scores = scoreboard.scores
                return value
            })
        },
        setScores: (scores: Record<number, QuestionPairScore>) => {
            scoreboard = new GameScoreboard(scores)
            store.update(value => {
                value.scores = scoreboard.scores
                return value
            })
        }
    }
}