import type { Category, ScoreType } from "./Game";

export type QuestionPairScore = {
    category: Category,
    tossup: Record<string, TossupScore>,
    bonus: {
        teamId: string,
        correct: boolean
    } | null
}

type TossupScore = {
    playerId: string,
    scoreType: ScoreType
}

export interface GameScoreboard {
    pointValues: {
        tossup: number,
        bonus: number,
        penalty: number
    },
    scores: Record<number, QuestionPairScore>
}

// main purpose is to keep track of point values for the game

export class GameScoreboard {
    constructor(
        scores: Record<number, QuestionPairScore> = {},
        pointValues: {
            tossup?: number,
            bonus?: number,
            penalty?: number
        } = { tossup: 4, bonus: 10, penalty: -4 }
    ) {
        this.scores = scores
        this.pointValues = {
            tossup: pointValues.tossup || 4,
            bonus: pointValues.bonus || 10, 
            penalty: pointValues.penalty || -4
        }
    }

    correctTossup(number: number, playerId: string, teamId: string, category: Category) {
        if (this.scores[number]) {
            this.scores[number].tossup[teamId] = {
                playerId,
                scoreType: "correct"
            }
            this.scores[number].bonus = null
        } else {
            this.scores[number] = {
                category,
                tossup: {
                    [teamId]: {
                        playerId,
                        scoreType: "correct"
                    }
                },
                bonus: null
            }
        }
    }

    incorrectTossup(number: number, playerId: string, teamId: string, category: Category) {
        if (this.scores[number]) {
            this.scores[number].tossup[teamId] = {
                playerId,
                scoreType: "incorrect"
            }
            this.scores[number].bonus = null
        } else {
            this.scores[number] = {
                category,
                tossup: {
                    [teamId]: {
                        playerId,
                        scoreType: "incorrect"
                    }
                },
                bonus: null
            }
        }
    }

    penalty(number: number, playerId: string, teamId: string, category: Category) {
        if (this.scores[number]) {
            this.scores[number].tossup[teamId] = {
                playerId,
                scoreType: "penalty"
            }
            this.scores[number].bonus = null
        } else {
            this.scores[number] = {
                category,
                tossup: {
                    [teamId]: {
                        playerId,
                        scoreType: "penalty"
                    }
                },
                bonus: null
            }
        }
    }

    correctBonus(number: number, teamId: string, category: Category) {
        if (this.scores[number]) {
            this.scores[number].bonus = {
                teamId,
                correct: true
            }
        } else {
            this.scores[number] = {
                category,
                tossup: {},
                bonus: {
                    teamId,
                    correct: true
                }
            }
        }
    }

    incorrectBonus(number: number, teamId: string, category: Category) {
        if (this.scores[number]) {
            this.scores[number].bonus = {
                teamId,
                correct: false
            }
        } else {
            this.scores[number] = {
                category,
                tossup: {},
                bonus: {
                    teamId,
                    correct: false
                }
            }
        }
    }

    clearQuestion(number: number) {
        delete this.scores[number]
    }
}