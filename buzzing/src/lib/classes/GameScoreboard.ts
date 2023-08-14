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

export type Scores = Record<number, QuestionPairScore>

export interface GameScoreboard {
    pointValues: {
        tossup: number,
        bonus: number,
        penalty: number
    },
    scores: Scores
}

// main purpose is to keep track of point values for the game

export class GameScoreboard {
    constructor(
        scores: Scores = {},
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
        const questionRow = this.scores[number]
        if (questionRow) {
            questionRow.tossup[teamId] = {
                playerId,
                scoreType: "correct"
            }
            questionRow.bonus = null
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
        const questionRow = this.scores[number]
        if (questionRow) {
            questionRow.tossup[teamId] = {
                playerId,
                scoreType: "incorrect"
            }
            questionRow.bonus = null
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
        const questionRow = this.scores[number]
        if (questionRow) {
            questionRow.tossup[teamId] = {
                playerId,
                scoreType: "penalty"
            }
            questionRow.bonus = null
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

    dead(number: number, category: Category) {
        if (!this.scores[number]) {
            this.scores[number] = {
                category,
                tossup: {},
                bonus: null
            }
        }
    }

    editTossup(
        number: number,
        playerId: string,
        teamId: string,
        category: Category,
        scoreType: ScoreType | "none"
    ) {
        const questionRow = this.scores[number]
        if (questionRow) {
            if (scoreType === "none") {
                delete questionRow.tossup[teamId]
            } else {
                questionRow.tossup[teamId] = {
                    playerId,
                    scoreType
                }
            }
        } else if (scoreType !== "none") {
            this.scores[number] = {
                category,
                tossup: {
                    [teamId]: {
                        playerId,
                        scoreType
                    }
                },
                bonus: null
            }
        }
    }

    correctBonus(number: number, teamId: string, category: Category) {
        const questionRow = this.scores[number]
        if (questionRow) {
            questionRow.bonus = {
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
        const questionRow = this.scores[number]
        if (questionRow) {
            questionRow.bonus = {
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

    editBonus(
        number: number,
        teamId: string,
        scoreType: "correct" | "incorrect" | "none"
    ) {
        const questionRow = this.scores[number]
        if (questionRow && scoreType === "none") {
            questionRow.bonus = null
        } else if (questionRow) {
            questionRow.bonus = {
                teamId,
                correct: scoreType === "correct"
            }
        }
    }

    clearQuestion(number: number) {
        delete this.scores[number]
    }

    deleteQuestion(number: number) {
        delete this.scores[number]
        const max = Math.max(...Object.keys(this.scores).map(Number))
        for (let i = number + 1; i <= max; i++) {
            const questionRow = this.scores[i]
            if (questionRow) {
                this.scores[i - 1] = questionRow
                delete this.scores[i]
            }
        }
    }
}