import type { TeamScoreboard } from "./TeamScoreboard"

type category = "earth" | "chem" | "math" | "bio" | "physics" | "energy"
type catScore = { correct: number, incorrect: number }
type catScores = Record<category, catScore>

export interface MemberScoreboard {
    score: number,
    catScores: catScores,
    teamScoreboard: TeamScoreboard | null
}

const emptyCatScores: catScores = {
    earth: {correct: 0, incorrect: 0},
    chem: {correct: 0, incorrect: 0},
    math: {correct: 0, incorrect: 0},
    bio: {correct: 0, incorrect: 0},
    physics: {correct: 0, incorrect: 0},
    energy: {correct: 0, incorrect: 0}
}

export class MemberScoreboard {
    constructor(teamScoreboard?: TeamScoreboard) {
        this.score = 0
        this.catScores = emptyCatScores
        this.teamScoreboard = teamScoreboard || null
    }

    correctAnswer(category: category, value: number) {
        console.log(category)
        this.score += value
        this.catScores[category].correct += 1

        if (this.teamScoreboard) {
            this.teamScoreboard.correctAnswer(category, value)
        }
    }

    incorrectAnswer(category: category, value: number) {
        this.score += value
        this.catScores[category].incorrect += 1

        if (this.teamScoreboard) {
            this.teamScoreboard.incorrectAnswer(category, value)
        }
    }

    penalty(category: category | null, value: number) {
        this.score += value
        if (category) {
            this.catScores[category].incorrect += 1
        }

        if (this.teamScoreboard) {
            this.teamScoreboard.penalty(category, value)
        }
    }
}