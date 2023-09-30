import type { Category } from "$lib/classes/Game";
import type { Stats } from "$lib/mongo";
import { json2csv } from "json-2-csv";
import type { NamedScores } from "./scoreboard";

export type InputRequestData = {
    type: "teamNameAlias",
    names: {
        item: string,
        score: number
    }[],
    original: string
} | {
    type: "playerNameAlias",
    names: {
        item: string,
        score: number
    }[],
    original: string
}

/*
    {
        bpg: bonuses correct per game
        npg: negs on tossups per game
        ppg: points per game total
        accuracy: percent of buzzes that are correct
        buzzes: total number of buzzes on tossups
        tuh: tossups heard
    }
*/

export default async function calculateStatistics(games: NamedScores[]) {
    const playerStats: Record<string, Stats> = {}
    const teamStats: Record<string, Stats> = {}

    for (const game of games) {
        const { playerCounts, teamCounts } = gameStatistics(game)
        for (const name of Object.keys(teamCounts)) {
            const c  = teamCounts[name]!
            if (Object.hasOwn(teamStats, name)) {
                const s = teamStats[name]!
                s.bpg = weightedAvg(s.bpg, s.gamesPlayed, c.bonus)
                s.npg = weightedAvg(s.npg, s.gamesPlayed, c.penalty)
                s.ppg = weightedAvg(
                    s.ppg,
                    s.gamesPlayed,
                    c.correct * pointValues.tossup
                    + c.bonus * pointValues.bonus
                    + c.penalty * pointValues.penalty
                )
                s.accuracy = (s.accuracy * s.buzzes + c.correct)
                    / Math.max(s.buzzes + c.correct + c.incorrect + c.penalty, 1)
                s.buzzes += c.correct + c.incorrect + c.penalty
                s.tuh += c.tuh
                for (const cat of categories) {
                    const catS = s.categories[cat]
                    const catC = c.categories[cat]
                    catS.bpg = weightedAvg(catS.bpg, s.gamesPlayed, catC.bonus)
                    catS.npg = weightedAvg(catS.npg, s.gamesPlayed, catC.penalty)
                    catS.ppg = weightedAvg(
                        catS.ppg,
                        s.gamesPlayed,
                        catC.correct * pointValues.tossup
                        + catC.bonus * pointValues.bonus
                        + catC.penalty * pointValues.penalty
                    )
                    catS.accuracy = (catS.accuracy * catS.buzzes + catC.correct)
                        / Math.max(catS.buzzes + catC.correct + catC.incorrect + catC.penalty, 1)
                    catS.buzzes += catC.correct + catC.incorrect + catC.penalty
                    catS.tuh += catC.tuh
                }
                s.gamesPlayed++
            } else {
                teamStats[name] = {
                    bpg: c.bonus,
                    npg: c.penalty,
                    ppg: c.correct * pointValues.tossup
                        + c.bonus * pointValues.bonus
                        + c.penalty * pointValues.penalty,
                    accuracy: c.correct / Math.max(c.correct + c.incorrect + c.penalty, 1),
                    gamesPlayed: 1,
                    tuh: c.tuh,
                    buzzes: c.correct + c.incorrect + c.penalty,
                    categories: Object.fromEntries(categories.map(x => [x, {
                        bpg: c.categories[x].bonus,
                        npg: c.categories[x].penalty,
                        ppg: c.categories[x].correct * pointValues.tossup
                            + c.categories[x].bonus * pointValues.bonus
                            + c.categories[x].penalty * pointValues.penalty,
                        accuracy: c.categories[x].correct
                            / Math.max(c.categories[x].correct + c.categories[x].incorrect + c.categories[x].penalty, 1),
                        tuh: c.categories[x].tuh,
                        buzzes: c.categories[x].correct + c.categories[x].incorrect + c.categories[x].penalty
                    }]))
                } as Stats
            }
        }

        for (const name of Object.keys(playerCounts)) {
            const c = playerCounts[name]!
            if (Object.hasOwn(playerStats, name)) {
                const s = playerStats[name]!
                s.bpg = weightedAvg(s.bpg, s.gamesPlayed, c.bonus)
                s.npg = weightedAvg(s.npg, s.gamesPlayed, c.penalty)
                s.ppg = weightedAvg(
                    s.ppg,
                    s.gamesPlayed,
                    c.correct * pointValues.tossup
                    + c.bonus * pointValues.bonus
                    + c.penalty * pointValues.penalty
                )
                s.accuracy = (s.accuracy * s.buzzes + c.correct)
                    / Math.max(s.buzzes + c.correct + c.incorrect + c.penalty, 1)
                s.buzzes += c.correct + c.incorrect + c.penalty
                s.tuh += c.tuh
                for (const cat of categories) {
                    const catS = s.categories[cat]
                    const catC = c.categories[cat]
                    catS.bpg = weightedAvg(catS.bpg, s.gamesPlayed, catC.bonus)
                    catS.npg = weightedAvg(catS.npg, s.gamesPlayed, catC.penalty)
                    catS.ppg = weightedAvg(
                        catS.ppg,
                        s.gamesPlayed,
                        catC.correct * pointValues.tossup
                        + catC.bonus * pointValues.bonus
                        + catC.penalty * pointValues.penalty
                    )
                    catS.accuracy = (catS.accuracy * catS.buzzes + catC.correct)
                        / Math.max(catS.buzzes + catC.correct + catC.incorrect + catC.penalty, 1)
                    catS.buzzes += catC.correct + catC.incorrect + catC.penalty
                    catS.tuh += catC.tuh
                }
                s.gamesPlayed++
            } else {
                playerStats[name] = {
                    bpg: c.bonus,
                    npg: c.penalty,
                    ppg: c.correct * pointValues.tossup + c.bonus * pointValues.bonus + c.penalty * pointValues.penalty,
                    accuracy: c.correct / Math.max(c.correct + c.incorrect + c.penalty, 1),
                    gamesPlayed: 1,
                    tuh: c.tuh,
                    buzzes: c.correct + c.incorrect + c.penalty,
                    categories: Object.fromEntries(categories.map(x => [x, {
                        bpg: c.categories[x].bonus,
                        npg: c.categories[x].penalty,
                        ppg: c.categories[x].correct * pointValues.tossup
                            + c.categories[x].bonus * pointValues.bonus
                            + c.categories[x].penalty * pointValues.penalty,
                        accuracy: c.categories[x].correct
                            / Math.max(c.categories[x].correct + c.categories[x].incorrect + c.categories[x].penalty, 1),
                        tuh: c.categories[x].tuh,
                        buzzes: c.categories[x].correct + c.categories[x].incorrect + c.categories[x].penalty
                    }]))
                } as Stats
            }
        }
    }
    
    return {
        teamStats,
        playerStats
    }
}

type QuestionCounts = {
    tuh: number,
    correct: number,
    incorrect: number,
    penalty: number,
    bonus: number,
    categories: Record<Category, {
        tuh: number,
        correct: number,
        incorrect: number,
        penalty: number,
        bonus: number
    }>
}

const categories: Category[] = ["bio", "earth", "chem", "physics", "math", "energy"]
const pointValues = {
    tossup: 4,
    bonus: 10,
    penalty: -4
}

const defaultQuestionCounts = () => ({
    tuh: 0,
    correct: 0,
    incorrect: 0,
    penalty: 0,
    bonus: 0,
    categories: Object.fromEntries(categories.map(x => [x, {
        tuh: 0,
        correct: 0,
        incorrect: 0,
        penalty: 0,
        bonus: 0
    }]))
}) as QuestionCounts

function gameStatistics(game: NamedScores) {
    const teamPlayers = Object.values(game).reduce((acc, s) => {
        for (const t of Object.keys(s.tossup)) {
            if (!acc[t]) {
                acc[t] = [s.tossup[t]!.playerName]
            } else if (!acc[t]!.includes(s.tossup[t]!.playerName)) {
                acc[t]!.push(s.tossup[t]!.playerName)
            }
        }
        if (s.bonus?.teamName && !acc[s.bonus?.teamName]) {
            acc[s.bonus.teamName] = []
        }
        return acc
    }, {} as Record<string, string[]>)
    const playerList = Object.entries(teamPlayers)
        .map(([teamName, playerNames]) =>
            playerNames.map(x => generateCombinedKey(x, teamName))
        ).flat()
    const playerCounts: Record<string, QuestionCounts>
        = Object.fromEntries(playerList.map(x => [x, defaultQuestionCounts()]))
    const teamCounts: Record<string, QuestionCounts>
        = Object.fromEntries(Object.keys(teamPlayers).map(x => [x, defaultQuestionCounts()]))

    for (const question of Object.values(game)) {
        for (const counts of [...Object.values(playerCounts), ...Object.values(teamCounts)]) {
            counts.tuh++
            counts.categories[question.category].tuh++
        }
        for (const [teamName, { playerName, scoreType } ] of Object.entries(question.tossup)) {
            const pCounts = playerCounts[generateCombinedKey(playerName, teamName)]
            const tCounts = teamCounts[teamName]
            if (pCounts) {
                pCounts[scoreType]++
                pCounts.categories[question.category][scoreType]++
            }
            if (tCounts) {
                tCounts[scoreType]++
                tCounts.categories[question.category][scoreType]++
            }
        }
        if (question.bonus?.correct) {
            const tCounts = teamCounts[question.bonus.teamName]
            if (tCounts) {
                tCounts.bonus++
                tCounts.categories[question.category].bonus++
            }
        }
    }

    return {
        playerCounts,
        teamCounts
    }
}

function generateCombinedKey(playerName: string, teamName: string) {
    return `${playerName.replaceAll("[", "\\[").replaceAll("]", "\\]")} [${teamName}]`
}

function weightedAvg(base: number, baseWeight: number, num: number, numWeight: number = 1) {
    return (base * baseWeight + num * numWeight) / Math.max(baseWeight + numWeight, 1)
}

type CSVColumn = {
    field: keyof Stats | "name",
    entries: string[]
}
const statsFields: Omit<Record<keyof Stats, string>, "categories"> = {
    gamesPlayed: "GP",
    tuh: "TUH",
    buzzes: "Buzzes",
    ppg: "PPG",
    npg: "NPG",
    bpg: "BPG",
    accuracy: "Acc."
}

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type OptionalCategoryStats = Optional<Stats, "categories">

export async function convertStatsToCSV(stats: Record<string, OptionalCategoryStats>) {
    const cols: CSVColumn[] = [
        ...Object.keys(statsFields).map(k => ({
            field: k,
            entries: []
        })),
        {
            field: "name",
            entries: []
        }
    ] as CSVColumn[]

    for (const [name, s] of Object.entries(stats)) {
        for (const col of cols) {
            if (col.field === "name") {
                col.entries.push(name)
            } else if (col.field === "accuracy") {
                const val = s[col.field] as number
                col.entries.push((Math.round(val * 1000) / 10) + "%")
            } else {
                col.entries.push((Math.round(s[col.field] as number * 100) / 100).toString())
            }
        }
    }

    const data: Record<string, string>[] = []
    for (let i = 0; i < Object.keys(stats).length; i++) {
        const doc: Record<string, string> = {}
        for (const col of cols) {
            doc[col.field] = col.entries[i]!
        }
        data.push(doc)
    }

    const csv: string = await new Promise((res, rej) => {
        json2csv(data, (err, result) => {
            if (err) {
                rej(err)
            } else {
                res(result as string)
            }
        })
    })

    return csv
}