import type { Member } from "./Member";
type category = "earth" | "chem" | "math" | "bio" | "physics" | "energy"
type catScore = Record<category, number>

export interface GameScoreboard {
    pointValues: {
        tossup: number,
        bonus: number,
        penalty: number
    }
}

const emptyCatScores: catScore = {
    earth: 0,
    chem: 0,
    math: 0,
    bio: 0,
    physics: 0,
    energy: 0
}

export class GameScoreboard {
    constructor({ tossup = 4, bonus = 10, penalty = -4}: { tossup?: number, bonus?: number, penalty?: number }) {
        this.pointValues = {
            tossup,
            bonus, 
            penalty
        }
    }

    correctTossup(member: Member, category: category) {
        member.scoreboard.correctAnswer(category, this.pointValues.tossup)
    }

    incorrectTossup(member: Member, category: category) {
        member.scoreboard.incorrectAnswer(category, 0)
    }

    correctBonus(member: Member, category: category) {
        member.scoreboard.correctAnswer(category, this.pointValues.bonus)
    }

    incorrectBonus(member: Member, category: category) {
        member.scoreboard.incorrectAnswer(category, 0)
    }

    penalty(member: Member, category?: category) {
        member.scoreboard.penalty(category, this.pointValues.penalty)
    }
}