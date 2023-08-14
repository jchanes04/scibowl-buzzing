import type { ClientPlayer } from "$lib/classes/client/ClientPlayer"
import type { Category, Game, ScoreType } from "$lib/classes/Game"
import type { QuestionPairScore, Scores } from "$lib/classes/GameScoreboard"
import type { ClientTeamData } from "$lib/stores/teams"
import { json2csv } from "json-2-csv"

type CSVColumn = {
    type: "player",
    teamId: string,
    playerId: string,
    entries: string[]
} | {
    type: "bonus",
    teamId: string,
    entries: string[]
} | {
    type: "number",
    entries: string[]
} | {
    type: "category",
    entries: string[]
}

const scoreTypes: Record<ScoreType, string> = {
    "correct": "C",
    "incorrect": "I",
    "penalty": "P"
}

const categories: Record<Category, string> = {
    "bio": "B",
    "earth": "ES",
    "chem": "C",
    "physics": "P",
    "math": "M",
    "energy": "EN"
}

export async function convertToCSV(
    teamList: Record<string, ClientTeamData>,
    playerList: Record<string, ClientPlayer>,
    players: Record<string, string[]>,
    scores: Record<number, QuestionPairScore>
) {
    const cols: CSVColumn[] = [
        {
            type: "number",
            entries: []
        },
        {
            type: "category",
            entries: []
        }
    ]

    for (const [teamId, pList] of Object.entries(players)) {
        for (const playerId of pList) {
            cols.push({
                type: "player",
                teamId,
                playerId,
                entries: []
            })
        }
        cols.push({
            type: "bonus",
            teamId,
            entries: []
        })
    }

    for (const [num, s] of Object.entries(scores)) {
        for (const col of cols) {
            if (col.type === "number") {
                col.entries.push(num)
            } else if (col.type === "category") {
                col.entries.push(categories[s.category])
            } else if (col.type === "player") {
                const tossupEntry = s.tossup[col.teamId]
                if (tossupEntry?.playerId === col.playerId) {
                    col.entries.push(scoreTypes[tossupEntry.scoreType])
                } else {
                    col.entries.push("")
                }
            } else if (col.type === "bonus") {
                if (s.bonus?.teamId === col.teamId) {
                    col.entries.push(s.bonus.correct ? "C" : "I")
                } else {
                    col.entries.push("")
                }
            }
        }
    }

    const columnNames = ["number", "category"]
    for (const col of cols) {
        if (col.type === "player") {
            columnNames.push(playerList[col.playerId]?.name || col.playerId)
        } else if (col.type === "bonus") {
            columnNames.push((playerList[col.teamId]?.name || col.teamId) + " Bonus")
        }
    }

    const data: Record<string, string>[] = []
    for (let i = 0; i < Object.keys(scores).length; i++) {
        const doc: Record<string, string> = {}
        for (const col of cols) {
            if (col.type === "number") {
                doc.number = col.entries[i]!
            } else if (col.type === "category") {
                doc.category = col.entries[i]!
            } else if (col.type === "player") {
                doc[playerList[col.playerId]?.name || col.playerId] = col.entries[i]!
            } else if (col.type === "bonus") {
                doc[(teamList[col.teamId]?.name || col.teamId) + " Bonus"] = col.entries[i]!
            }
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

export type NamedQuestionPairScore = {
    category: Category,
    tossup: Record<string, NamedTossupScore>,
    bonus: {
        teamName: string,
        correct: boolean
    } | null
}

type NamedTossupScore = {
    playerName: string,
    scoreType: ScoreType
}

export type NamedScores = Record<number, NamedQuestionPairScore>

export function addNamesToScores(game: Game, scores: Scores): NamedScores {
    function getTeamName(teamId: string) {
        const teamData = game.teams[teamId]?.data ?? Object.values(game.leftPlayers).find(x => x.teamID === teamId)?.team
        return teamData?.name || teamId
    }

    function getPlayerName(playerId: string) {
        const allPeople = {
            ...game.leftModerators,
            ...game.moderators,
            ...game.leftPlayers,
            ...game.players
        }
        const player = allPeople[playerId]
        return player?.name || playerId
    }

    return Object.fromEntries(Object.entries(scores).map(([number, pair]) => {
        const namedPair: NamedQuestionPairScore = {
            category: pair.category,
            tossup: Object.fromEntries(Object.entries(pair.tossup).map(([teamId, tossupScore]) => {
                return [getTeamName(teamId), {
                    playerName: getPlayerName(tossupScore.playerId),
                    scoreType: tossupScore.scoreType
                }]
            })),
            bonus: pair.bonus ? { 
                teamName: getTeamName(pair.bonus.teamId),
                correct: pair.bonus.correct
            } : null
        }
        return [number, namedPair]
    }))
}

type CSVColumnNamed = {
    type: "player",
    teamName: string,
    playerName: string,
    entries: string[]
} | {
    type: "bonus",
    teamName: string,
    entries: string[]
} | {
    type: "number",
    entries: string[]
} | {
    type: "category",
    entries: string[]
}

export async function convertToCSVNamed(players: Record<string, string[]>, scores: NamedScores) {
    const cols: CSVColumnNamed[] = [
        {
            type: "number",
            entries: []
        },
        {
            type: "category",
            entries: []
        }
    ]

    for (const [teamName, pList] of Object.entries(players)) {
        for (const playerName of pList) {
            cols.push({
                type: "player",
                teamName,
                playerName,
                entries: []
            })
        }
        cols.push({
            type: "bonus",
            teamName,
            entries: []
        })
    }

    for (const [num, s] of Object.entries(scores)) {
        for (const col of cols) {
            if (col.type === "number") {
                col.entries.push(num)
            } else if (col.type === "category") {
                col.entries.push(categories[s.category])
            } else if (col.type === "player") {
                const tossupEntry = s.tossup[col.teamName]
                if (tossupEntry?.playerName === col.playerName) {
                    col.entries.push(scoreTypes[tossupEntry.scoreType])
                } else {
                    col.entries.push("")
                }
            } else if (col.type === "bonus") {
                if (s.bonus?.teamName === col.teamName) {
                    col.entries.push(s.bonus.correct ? "C" : "I")
                } else {
                    col.entries.push("")
                }
            }
        }
    }

    const columnNames = ["number", "category"]
    for (const col of cols) {
        if (col.type === "player") {
            columnNames.push(col.playerName)
        } else if (col.type === "bonus") {
            columnNames.push(col.teamName + " Bonus")
        }
    }

    const data: Record<string, string>[] = []
    for (let i = 0; i < Object.keys(scores).length; i++) {
        const doc: Record<string, string> = {}
        for (const col of cols) {
            if (col.type === "number") {
                doc.number = col.entries[i]!
            } else if (col.type === "category") {
                doc.category = col.entries[i]!
            } else if (col.type === "player") {
                doc[col.playerName] = col.entries[i]!
            } else if (col.type === "bonus") {
                doc[col.teamName + " Bonus"] = col.entries[i]!
            }
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