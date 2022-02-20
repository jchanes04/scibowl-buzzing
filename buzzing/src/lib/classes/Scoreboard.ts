type category = "earth" | "chem" | "math" | "bio" | "physics" | "energy"
type catScore = { correct: number, incorrect: number }
export type catScores = Record<category, catScore>

export interface Scoreboard {
    score: number,
    catScores: catScores,
    teamScoreboard: Scoreboard | null
}

export class Scoreboard {
    constructor({teamScoreboard, score, catScores}: {teamScoreboard?: Scoreboard, score?:number, catScores?: catScores }) {
        this.score = score || 0
        this.catScores = catScores || emptyCatScores()
        this.teamScoreboard = teamScoreboard || null
    }

    correctAnswer(category: category, value: number) {
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

    clear() {
        this.score = 0
        this.catScores = emptyCatScores()
    }

    setScore(score: number) {
        this.score = score
    }

    get data() {
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