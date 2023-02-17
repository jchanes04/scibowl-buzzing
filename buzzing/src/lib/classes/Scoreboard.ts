import type { Category } from "./Game"

type catScore = { correct: number, incorrect: number }
export type catScores = Record<Category, catScore>

export type ScoreboardData = {
    score: number,
    catScores: catScores,
    teamScoreboard: ScoreboardData | null
}

export interface Scoreboard {
    score: number,
    catScores: catScores,
    teamScoreboard: Scoreboard | null
}

export class Scoreboard {
    constructor({teamScoreboard, score, catScores}: {teamScoreboard?: Scoreboard | null, score?: number, catScores?: catScores }) {
        this.score = score || 0
        this.catScores = catScores || emptyCatScores()
        this.teamScoreboard = teamScoreboard || null
    }

    correctAnswer(category: Category, value: number) {
        this.score += value
        this.catScores[category].correct += 1

        if (this.teamScoreboard) {
            this.teamScoreboard.correctAnswer(category, value)
        }
    }

    incorrectAnswer(category: Category, value: number) {
        this.score += value
        this.catScores[category].incorrect += 1

        if (this.teamScoreboard) {
            this.teamScoreboard.incorrectAnswer(category, value)
        }
    }

    penalty(category: Category | null, value: number) {
        this.score += value
        if (category) {
            this.catScores[category].incorrect += 1
        }

        if (this.teamScoreboard) {
            this.teamScoreboard.penalty(category, value)
        }
    }

    undoScore(scoreType: "correct" | "incorrect" | "penalty", category: Category, value: number) {
        if (scoreType === "correct") {
            this.score -= value
            this.catScores[category].correct -= 1
        } else if (scoreType === "incorrect") {
            this.catScores[category].incorrect -= 1
        } else {
            this.score -= value
            this.catScores[category].incorrect -= 1
        }

        if (this.teamScoreboard) {
            this.teamScoreboard.undoScore(scoreType, category, value)
        }

        return true
    }

    clear() {
        this.score = 0
        this.catScores = emptyCatScores()
    }

    setScore(score: number) {
        this.score = score
    }

    get data(): ScoreboardData {
        return {
            score: this.score,
            catScores: this.catScores,
            teamScoreboard: this.teamScoreboard?.data || null
        }
    }
}

export function emptyCatScores(): catScores {
    return {
        earth: {correct: 0, incorrect: 0},
        chem: {correct: 0, incorrect: 0},
        math: {correct: 0, incorrect: 0},
        bio: {correct: 0, incorrect: 0},
        physics: {correct: 0, incorrect: 0},
        energy: {correct: 0, incorrect: 0}
    }
}