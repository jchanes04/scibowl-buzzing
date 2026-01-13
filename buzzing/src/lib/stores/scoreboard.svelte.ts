import { GameScoreboard, type QuestionPairScore } from "$lib/classes/GameScoreboard";
import type { Category, ScoreType } from "$lib/classes/Game";

let scoreboard = $state(new GameScoreboard({}))

export default {
    get value() {
        return scoreboard.scores;
    },
    get pointValues() {
        return scoreboard.pointValues;
    },
    setScores: (scores: Record<number, QuestionPairScore>) => {
        scoreboard = new GameScoreboard(scores)
    },
    correctTossup: (number: number, playerId: string, teamId: string, category: Category) => {
        scoreboard.correctTossup(
            number,
            playerId,
            teamId,
            category
        )
        scoreboard = scoreboard
    },
    incorrectTossup: (number: number, playerId: string, teamId: string, category: Category) => {
        scoreboard.incorrectTossup(
            number,
            playerId,
            teamId,
            category
        )
        scoreboard = scoreboard
    },
    penalty: (number: number, playerId: string, teamId: string, category: Category) => {
        scoreboard.penalty(
            number,
            playerId,
            teamId,
            category
        )
        scoreboard = scoreboard
    },
    dead: (number: number, category: Category) => {
        scoreboard.dead(number, category)
        scoreboard = scoreboard
    },
    editTossup: (
        number: number,
        playerId: string,
        teamId: string,
        category: Category,
        scoreType: ScoreType | "none"
    ) => {
        scoreboard.editTossup(number, playerId, teamId, category, scoreType)
        scoreboard = scoreboard
    },
    correctBonus: (number: number, teamId: string, category: Category) => {
        scoreboard.correctBonus(
            number,
            teamId,
            category
        )
        scoreboard = scoreboard
    },
    incorrectBonus: (number: number, teamId: string, category: Category) => {
        scoreboard.incorrectBonus(
            number,
            teamId,
            category
        )
        scoreboard = scoreboard
    },
    editBonus: (
        number: number,
        teamId: string,
        scoreType: "correct" | "incorrect" | "none"
    ) => {
        scoreboard.editBonus(number, teamId, scoreType)
        scoreboard = scoreboard
    },
    clear: () => {
        scoreboard = new GameScoreboard()
    },
    clearQuestion: (number: number) => {
        scoreboard.clearQuestion(number)
        scoreboard = scoreboard
    },
    deleteQuestion: (number: number) => {
        scoreboard.deleteQuestion(number)
        scoreboard = scoreboard
    }
}
