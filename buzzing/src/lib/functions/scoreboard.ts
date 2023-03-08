import type { ClientPlayer } from "$lib/classes/client/ClientPlayer"
import type { ClientTeam } from "$lib/classes/client/ClientTeam"
import type { Category, ScoreType } from "$lib/classes/Game"
import type { QuestionPairScore } from "$lib/classes/GameScoreboard"
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
                if (s.tossup[col.teamId]?.playerId === col.playerId) {
                    col.entries.push(scoreTypes[s.tossup[col.teamId].scoreType])
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
                doc.number = col.entries[i]
            } else if (col.type === "category") {
                doc.category = col.entries[i]
            } else if (col.type === "player") {
                doc[playerList[col.playerId]?.name || col.playerId] = col.entries[i]
            } else if (col.type === "bonus") {
                doc[(teamList[col.teamId]?.name || col.teamId) + " Bonus"] = col.entries[i]
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