
type category = "earth" | "chem" | "math" | "bio" | "physics" | "energy"
type catScore = { correct: number, incorrect: number }
type catScores = Record<category, catScore>

export interface TeamScoreboard {
    score: number,
    catScores: catScores
}

export class TeamScoreboard {
    constructor() {
        this.score = 0
        this.catScores = emptyCatScores()
    }

    correctAnswer(category: category, value: number) {
        this.score += value
        this.catScores[category].correct += 1
    }

    incorrectAnswer(category: category, value: number) {
        this.score += value
        this.catScores[category].incorrect += 1
    }

    penalty(category: category | null, value: number) {
        this.score += value

        if (category) {
            this.catScores[category].incorrect += 1
        }
    }

    clear() {
        this.score = 0
        this.catScores = emptyCatScores()
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