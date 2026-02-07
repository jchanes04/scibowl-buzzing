import type { Category, ScoreType } from "$lib/classes/Game"
import type { Scores, QuestionPairScore } from "$lib/stores/scoreboard.svelte"
import type { ScoreboardPlayerNames, ScoreboardTeamNames } from "$lib/stores/scoreboard.svelte"
import type { Member, Team } from "$lib/types/members"
import pkg from "json-2-csv"
const { json2csv } = pkg

export type PointValues = {
    tossup: number;
    bonus: number;
    penalty: number;
};

/**
 * Derive playerNames lookup from members snapshot
 * Filters to players with a teamId
 */
export function derivePlayerNames(members: Record<string, Member>): ScoreboardPlayerNames {
    const playerNames: ScoreboardPlayerNames = {};
    for (const [id, member] of Object.entries(members)) {
        if (member.type === "player" && member.teamId) {
            playerNames[id] = { name: member.name, teamId: member.teamId };
        }
    }
    return playerNames;
}

/**
 * Derive teamNames lookup from teams snapshot
 */
export function deriveTeamNames(teams: Record<string, Team>): ScoreboardTeamNames {
    const teamNames: ScoreboardTeamNames = {};
    for (const [id, team] of Object.entries(teams)) {
        teamNames[id] = team.name;
    }
    return teamNames;
}

/**
 * Calculate the total score for a team given scores data and point values
 */
export function calculateTeamScore(
    teamId: string,
    scores: Scores,
    pointValues: PointValues
): number {
    return Object.values(scores).reduce((acc: number, q: QuestionPairScore) => {
        if (q.tossup[teamId]?.scoreType === "correct") {
            acc += pointValues.tossup;
        } else if (q.tossup[teamId]?.scoreType === "penalty") {
            acc += pointValues.penalty;
        }

        if (q.bonus?.teamId === teamId && q.bonus?.correct) {
            acc += pointValues.bonus;
        }
        return acc;
    }, 0);
}

const scoreTypes: Record<ScoreType, string> = {
    "correct": "C",
    "incorrect": "I",
    "penalty": "P",
    "subbed": "█"
}

const categories: Record<Category, string> = {
    "bio": "B",
    "earth": "ES",
    "chem": "C",
    "physics": "P",
    "math": "M",
    "energy": "EN"
}

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

export async function convertToCSV(
    teamList: ScoreboardTeamNames,
    playerList: ScoreboardPlayerNames,
    players: Record<string, string[]>,
    scores: Scores
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
                doc[(teamList[col.teamId] || col.teamId) + " Bonus"] = col.entries[i]!
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

/**
 * Combine two player lists, merging players from both
 */
export function combinePlayersLists(
    list1: Record<string, string[]>,
    list2: Record<string, string[]>,
): Record<string, string[]> {
    const list: Record<string, string[]> = {};
    const keys = new Set([...Object.keys(list1), ...Object.keys(list2)]);
    for (const teamId of keys) {
        list[teamId] = [
            ...(list1[teamId] || []),
            ...(list2[teamId] || []).filter(
                (x) => !(list1[teamId] || []).includes(x),
            ),
        ];
    }
    return list;
}

/**
 * Get players grouped by team from scores
 */
export function getPlayersFromScores(scores: Scores): Record<string, string[]> {
    return Object.values(scores).reduce(
        (acc: Record<string, string[]>, s: QuestionPairScore) => {
            for (const t of Object.keys(s.tossup)) {
                const entry = s.tossup[t];
                if (entry) {
                    if (!acc[t]) {
                        acc[t] = [entry.playerId];
                    } else if (!acc[t]!.includes(entry.playerId)) {
                        acc[t]!.push(entry.playerId);
                    }
                }
            }
            return acc;
        },
        {} as Record<string, string[]>,
    );
}

/**
 * Get players grouped by team from team membership data
 */
export function getPlayersFromTeams(
    playerList: ScoreboardPlayerNames,
    teamList: ScoreboardTeamNames,
): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const [playerId, playerInfo] of Object.entries(playerList || {})) {
        if (playerInfo && playerInfo.teamId && teamList[playerInfo.teamId]) {
            if (!result[playerInfo.teamId]) result[playerInfo.teamId] = [];
            if (!result[playerInfo.teamId]?.includes(playerId)) {
                result[playerInfo.teamId]?.push(playerId);
            }
        }
    }
    return result;
}

/**
 * Generate an ASCII table representation of the scoreboard
 * Suitable for copying to Discord, chat, or text-based formats
 */
export function convertToASCII(
    teamList: ScoreboardTeamNames,
    playerList: ScoreboardPlayerNames,
    players: Record<string, string[]>,
    scores: Scores,
    pointValues: PointValues
): string {
    const teamIds = Object.keys(players).sort((a, b) => {
        const nameA = (teamList[a] || a).toLowerCase();
        const nameB = (teamList[b] || b).toLowerCase();
        return nameA.localeCompare(nameB);
    });

    if (teamIds.length === 0) return "No scores recorded";

    const rowNumber = Math.max(0, ...Object.keys(scores).map(Number));
    if (rowNumber === 0) return "No questions recorded";

    // Build column structure: #, Cat, then for each team: [players...], Bonus, Score
    type Column = { header: string; width: number; teamId?: string; playerId?: string; type: 'num' | 'cat' | 'player' | 'bonus' | 'score' };
    const columns: Column[] = [
        { header: '#', width: 3, type: 'num' },
        { header: 'Cat', width: 3, type: 'cat' },
    ];

    for (const teamId of teamIds) {
        const teamPlayers = players[teamId] || [];
        for (const playerId of teamPlayers) {
            const name = playerList[playerId]?.name || 'Unk';
            // Use first 3 letters of name
            const displayName = name.slice(0, 3);
            columns.push({ header: displayName, width: 3, teamId, playerId, type: 'player' });
        }
        columns.push({ header: 'Bon', width: 3, teamId, type: 'bonus' });
        columns.push({ header: 'Score', width: 5, teamId, type: 'score' });
    }

    // Calculate running scores
    const runningScores: Record<number, Record<string, number>> = {};
    let totals: Record<string, number> = {};
    for (let i = 1; i <= rowNumber; i++) {
        const row = scores[i];
        if (row) {
            totals = { ...totals };
            for (const [teamId, entry] of Object.entries(row.tossup)) {
                if (!totals[teamId]) totals[teamId] = 0;
                if (entry?.scoreType === "correct") totals[teamId] += pointValues.tossup;
                else if (entry?.scoreType === "penalty") totals[teamId] += pointValues.penalty;
            }
            if (row.bonus?.teamId) {
                const bonusTeamId = row.bonus.teamId;
                if (!totals[bonusTeamId]) totals[bonusTeamId] = 0;
                if (row.bonus.correct) totals[bonusTeamId] += pointValues.bonus;
            }
        }
        runningScores[i] = { ...totals };
    }

    // Helper to pad string
    const pad = (s: string, w: number) => s.padStart(Math.floor((w + s.length) / 2)).padEnd(w);
    const padLeft = (s: string, w: number) => s.padStart(w);

    // ANSI color codes for Discord
    const RESET = '\u001b[0m';
    const GREEN = '\u001b[0;32m';
    const RED = '\u001b[0;31m';
    const PURPLE = '\u001b[0;35m';
    const CYAN = '\u001b[0;36m';  // Closest to #285 (teal)
    const DIM = '\u001b[2;37m';   // Dim white for grayer gray
    const BOLD = '\u001b[1m';

    // Helper to colorize based on score type
    const colorize = (text: string, scoreType: string): string => {
        if (scoreType === 'correct') return `${GREEN}${text}${RESET}`;
        if (scoreType === 'incorrect') return `${RED}${text}${RESET}`;
        if (scoreType === 'penalty') return `${PURPLE}${text}${RESET}`;
        if (scoreType === 'subbed') return `${DIM}${text}${RESET}`;
        return text;
    };

    const lines: string[] = [];
    lines.push('```ansi');

    // ASCII art header with cyan (closest to primary #285)
    lines.push(`${CYAN}███████╗███████╗██████╗  ██████╗ ████████╗${RESET}`);
    lines.push(`${CYAN}██╔════╝██╔════╝██╔══██╗██╔═══██╗╚══██╔══╝${RESET}`);
    lines.push(`${CYAN}█████╗  ███████╗██████╔╝██║   ██║   ██║   ${RESET}`);
    lines.push(`${CYAN}██╔══╝  ╚════██║██╔══██╗██║   ██║   ██║   ${RESET}`);
    lines.push(`${CYAN}███████╗███████║██████╔╝╚██████╔╝   ██║   ${RESET}`);
    lines.push(`${CYAN}╚══════╝╚══════╝╚═════╝  ╚═════╝    ╚═╝   ${RESET}`);
    lines.push('');
    // Team header row
    let teamHeaderParts: string[] = ['   ', '   ']; // # and Cat columns
    for (const teamId of teamIds) {
        const teamPlayers = players[teamId] || [];
        const teamName = teamList[teamId] || teamId;
        const teamColWidth = teamPlayers.reduce((sum, pid) => {
            const col = columns.find(c => c.playerId === pid);
            return sum + (col ? col.width + 1 : 0);
        }, 0) + 3 + 1 + 5 + 1; // Bonus + Score + separators
        const displayTeamName = teamName.length > teamColWidth - 2 ? teamName.slice(0, teamColWidth - 3) + '.' : teamName;
        teamHeaderParts.push(`${BOLD}${pad(displayTeamName, teamColWidth - 1)}${RESET}`);
    }
    lines.push(teamHeaderParts.join('│'));

    const headerRow = columns.map(c => pad(c.header, c.width)).join('│');
    lines.push(headerRow);
    lines.push(columns.map(c => '─'.repeat(c.width)).join('┼'));

    // Data rows
    for (let i = 1; i <= rowNumber; i++) {
        const row = scores[i];
        const cells: string[] = [];

        for (const col of columns) {
            if (col.type === 'num') {
                cells.push(padLeft(String(i), col.width));
            } else if (col.type === 'cat') {
                cells.push(pad(row ? categories[row.category] : '', col.width));
            } else if (col.type === 'player' && col.teamId && col.playerId) {
                const entry = row?.tossup[col.teamId];
                if (entry?.playerId === col.playerId) {
                    const symbol = scoreTypes[entry.scoreType];
                    const colored = colorize(symbol, entry.scoreType);
                    // Pad around the colored text (colors don't take visual space)
                    const padding = col.width - symbol.length;
                    const leftPad = Math.floor(padding / 2);
                    const rightPad = padding - leftPad;
                    cells.push(' '.repeat(leftPad) + colored + ' '.repeat(rightPad));
                } else {
                    cells.push(pad('', col.width));
                }
            } else if (col.type === 'bonus' && col.teamId) {
                if (row?.bonus?.teamId === col.teamId) {
                    const symbol = row.bonus.correct ? 'C' : 'I';
                    const scoreType = row.bonus.correct ? 'correct' : 'incorrect';
                    const colored = colorize(symbol, scoreType);
                    const padding = col.width - symbol.length;
                    const leftPad = Math.floor(padding / 2);
                    const rightPad = padding - leftPad;
                    cells.push(' '.repeat(leftPad) + colored + ' '.repeat(rightPad));
                } else {
                    cells.push(pad('', col.width));
                }
            } else if (col.type === 'score' && col.teamId) {
                const score = runningScores[i]?.[col.teamId] ?? 0;
                cells.push(padLeft(String(score), col.width));
            } else {
                cells.push(pad('', col.width));
            }
        }
        lines.push(cells.join('│'));
    }

    lines.push(columns.map(c => '═'.repeat(c.width)).join('╪'));

    // Final totals row
    const totalCells: string[] = [];
    for (const col of columns) {
        if (col.type === 'num') {
            totalCells.push(pad('', col.width));
        } else if (col.type === 'cat') {
            totalCells.push(`${BOLD}${pad('TOT', col.width)}${RESET}`);
        } else if (col.type === 'score' && col.teamId) {
            const finalScore = calculateTeamScore(col.teamId, scores, pointValues);
            totalCells.push(`${BOLD}${padLeft(String(finalScore), col.width)}${RESET}`);
        } else {
            totalCells.push(pad('', col.width));
        }
    }
    lines.push(totalCells.join('│'));
    lines.push('```');

    return lines.join('\n');
}