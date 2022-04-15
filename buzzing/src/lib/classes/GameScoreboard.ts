import type { Category } from "./Game";
import type { Member } from "./Member";

export interface GameScoreboard {
    pointValues: {
        tossup: number,
        bonus: number,
        penalty: number
    }
}

// main purpose is to keep track of point values for the game

export class GameScoreboard {
    constructor({ tossup = 4, bonus = 10, penalty = -4}: { tossup?: number, bonus?: number, penalty?: number }) {
        this.pointValues = {
            tossup,
            bonus, 
            penalty
        }
    }

    correctTossup(member: Member, category: Category) {
        member.scoreboard.correctAnswer(category, this.pointValues.tossup)
    }

    incorrectTossup(member: Member, category: Category) {
        member.scoreboard.incorrectAnswer(category, 0)
    }

    correctBonus(member: Member, category: Category) {
        member.scoreboard.correctAnswer(category, this.pointValues.bonus)
    }

    incorrectBonus(member: Member, category: Category) {
        member.scoreboard.incorrectAnswer(category, 0)
    }

    penalty(member: Member, category?: Category) {
        member.scoreboard.penalty(category, this.pointValues.penalty)
    }

    undoScore(member: Member, scoreType: "correct" | "incorrect" | "penalty", category: Category, bonus: boolean = false) {
        const pointValue = scoreType === "incorrect"
            ? 0
            : bonus
                ? this.pointValues.bonus
                : scoreType === "correct"
                    ? this.pointValues.tossup
                    : this.pointValues.penalty
        return member.scoreboard.undoScore(scoreType, category, pointValue)
    }
}