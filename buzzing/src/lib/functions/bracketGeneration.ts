/**
 * Unified Bracket Generation Module
 *
 * Provides bracket generation logic for both Single Elimination (SE) and Double Elimination (DE) brackets.
 * This module is shared between frontend (bracket.svelte.ts) and backend (convex/tournaments.ts).
 *
 * Key design decisions:
 * - SE is represented as a "winners-only" bracket (losers and grandFinal are empty arrays)
 * - All matches use the unified BracketMatch interface with bracket: "winners" | "losers" | "grand_final"
 * - Both bracket types return the same structure: { winners, losers, grandFinal }
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Match bracket type (which sub-bracket the match belongs to)
 */
export type MatchBracket = "winners" | "losers" | "grand_final" | "roundrobin";

/**
 * Bracket type (single or double elimination, or round robin)
 */
export type BracketType = "single" | "double" | "roundrobin";

/**
 * Source match reference - indicates where a team advances from
 */
export interface SourceMatch {
    matchIndex: number;
    bracket: MatchBracket;
    takesWinner: boolean; // true = takes winner, false = takes loser (for losers bracket)
}

/**
 * Unified bracket match structure for all bracket types
 * Single elimination uses bracket: "winners" for all matches
 */
export interface BracketMatch {
    matchIndex: number;
    bracket: MatchBracket;
    round: number;
    team1Seed: number | null;
    team2Seed: number | null;
    sourceMatch1?: SourceMatch;
    sourceMatch2?: SourceMatch;
}

/**
 * Generated bracket structure (unified for SE, DE, and RR)
 */
export interface GeneratedBracket {
    winners: BracketMatch[];
    losers: BracketMatch[];
    grandFinal: BracketMatch[];
    roundrobin: BracketMatch[];
}

/**
 * Options for bracket generation
 */
export interface BracketGenerationOptions {
    bracketSize: number;
    bracketType: BracketType;
    winnerTakesAll?: boolean; // Only applies to double elimination
}

// ============================================================================
// SEED POSITION GENERATION
// ============================================================================

/**
 * Generate seed positions using standard tournament bracket seeding
 * Ensures proper matchups: 1 vs N, 2 vs N-1, etc. in finals if chalk
 *
 * Uses recursive algorithm to produce standard bracket seeding pattern:
 * For 8 teams: [1, 8, 4, 5, 2, 7, 3, 6]
 * This ensures 1v8, 4v5, 2v7, 3v6 in first round
 *
 * @param bracketSize - Must be a power of 2
 * @returns Array of seed positions
 */
export function generateSeedPositions(bracketSize: number): number[] {
    if (bracketSize === 2) return [1, 2];

    const half = bracketSize / 2;
    const left = generateSeedPositions(half);
    const right = generateSeedPositions(half);

    const result: number[] = [];
    for (let i = 0; i < half; i++) {
        result.push(left[i]!);
        result.push(bracketSize + 1 - right[i]!);
    }
    return result;
}

// ============================================================================
// UNIFIED BRACKET GENERATION
// ============================================================================

/**
 * Generate a complete bracket structure for any bracket type
 *
 * @param options - Bracket generation options
 * @returns Generated bracket with winners, losers, grandFinal, and roundrobin arrays
 */
export function generateBracket(options: BracketGenerationOptions): GeneratedBracket {
    const { bracketSize, bracketType, winnerTakesAll = true } = options;

    if (bracketSize < 2) {
        return { winners: [], losers: [], grandFinal: [], roundrobin: [] };
    }

    if (bracketType === "double") {
        const deBracket = generateDoubleEliminationBracket(bracketSize, winnerTakesAll);
        return { ...deBracket, roundrobin: [] };
    }

    if (bracketType === "roundrobin") {
        return {
            winners: [],
            losers: [],
            grandFinal: [],
            roundrobin: generateRoundRobinBracket(bracketSize),
        };
    }

    // Single elimination: winners bracket only
    return {
        winners: generateWinnersBracket(bracketSize),
        losers: [],
        grandFinal: [],
        roundrobin: [],
    };
}

/**
 * Generate winners bracket matches (used by both SE and DE)
 *
 * @param bracketSize - Number of teams
 * @returns Array of winners bracket matches
 */
function generateWinnersBracket(bracketSize: number): BracketMatch[] {
    const matches: BracketMatch[] = [];
    const numRounds = Math.ceil(Math.log2(bracketSize));
    const fullBracketSize = Math.pow(2, numRounds);
    const seedPositions = generateSeedPositions(fullBracketSize);

    let matchIndex = 0;
    const firstRoundMatches = fullBracketSize / 2;

    // Generate first round matches with seeds
    for (let i = 0; i < firstRoundMatches; i++) {
        const seed1 = seedPositions[i * 2] ?? 0;
        const seed2 = seedPositions[i * 2 + 1] ?? 0;
        matches.push({
            matchIndex,
            bracket: "winners",
            round: 0,
            team1Seed: seed1 > 0 && seed1 <= bracketSize ? seed1 : null,
            team2Seed: seed2 > 0 && seed2 <= bracketSize ? seed2 : null,
        });
        matchIndex++;
    }

    // Generate subsequent rounds
    let matchesInRound = firstRoundMatches / 2;
    let previousRoundStart = 0;
    for (let round = 1; round < numRounds; round++) {
        for (let i = 0; i < matchesInRound; i++) {
            matches.push({
                matchIndex,
                bracket: "winners",
                round,
                team1Seed: null,
                team2Seed: null,
                sourceMatch1: { matchIndex: previousRoundStart + i * 2, bracket: "winners", takesWinner: true },
                sourceMatch2: { matchIndex: previousRoundStart + i * 2 + 1, bracket: "winners", takesWinner: true },
            });
            matchIndex++;
        }
        previousRoundStart += matchesInRound * 2;
        matchesInRound = Math.floor(matchesInRound / 2);
    }

    return matches;
}

/**
 * Generate complete double elimination bracket
 *
 * @param bracketSize - Number of teams (must be power of 2)
 * @param winnerTakesAll - Whether to include GF reset match
 * @returns Generated bracket with winners, losers, and grandFinal
 */
function generateDoubleEliminationBracket(bracketSize: number, winnerTakesAll: boolean): GeneratedBracket {
    const numRounds = Math.ceil(Math.log2(bracketSize));
    const fullBracketSize = Math.pow(2, numRounds);
    const seedPositions = generateSeedPositions(fullBracketSize);

    // ============ WINNERS BRACKET ============
    const winners: BracketMatch[] = [];
    let winnersMatchIndex = 0;

    // First round (with seeds)
    const firstRoundMatches = fullBracketSize / 2;
    for (let i = 0; i < firstRoundMatches; i++) {
        const seed1 = seedPositions[i * 2] ?? 0;
        const seed2 = seedPositions[i * 2 + 1] ?? 0;
        winners.push({
            matchIndex: winnersMatchIndex,
            bracket: "winners",
            round: 0,
            team1Seed: seed1 > 0 && seed1 <= bracketSize ? seed1 : null,
            team2Seed: seed2 > 0 && seed2 <= bracketSize ? seed2 : null,
        });
        winnersMatchIndex++;
    }

    // Subsequent rounds in winners bracket
    let matchesInRound = firstRoundMatches / 2;
    let previousRoundStart = 0;
    for (let round = 1; round < numRounds; round++) {
        for (let i = 0; i < matchesInRound; i++) {
            winners.push({
                matchIndex: winnersMatchIndex,
                bracket: "winners",
                round,
                team1Seed: null,
                team2Seed: null,
                sourceMatch1: { matchIndex: previousRoundStart + i * 2, bracket: "winners", takesWinner: true },
                sourceMatch2: { matchIndex: previousRoundStart + i * 2 + 1, bracket: "winners", takesWinner: true },
            });
            winnersMatchIndex++;
        }
        previousRoundStart += matchesInRound * 2;
        matchesInRound = Math.floor(matchesInRound / 2);
    }

    const winnersFinalMatchIndex = winnersMatchIndex - 1;

    // ============ LOSERS BRACKET ============
    const losers: BracketMatch[] = [];
    let losersMatchIndex = 0;

    // Track matches by round for winners (for referencing losers)
    const winnersMatchesByRound: number[][] = [];
    let startIdx = 0;
    let countInRound = firstRoundMatches;
    for (let r = 0; r < numRounds; r++) {
        const matchesInThisRound: number[] = [];
        for (let i = 0; i < countInRound; i++) {
            matchesInThisRound.push(startIdx + i);
        }
        winnersMatchesByRound.push(matchesInThisRound);
        startIdx += countInRound;
        countInRound = Math.floor(countInRound / 2);
    }

    // Build losers bracket
    // Round 0: Losers from winners round 0 play each other
    // Round 1: Winners of losers round 0 play losers from winners round 1
    // Round 2: Winners of losers round 1 play each other
    // etc.

    let losersRound = 0;
    let prevLosersMatchIndices: number[] = [];

    // First losers round: R0 losers play each other
    const r0Losers = winnersMatchesByRound[0] || [];
    const losersR0Matches = r0Losers.length / 2;

    for (let i = 0; i < losersR0Matches; i++) {
        losers.push({
            matchIndex: losersMatchIndex,
            bracket: "losers",
            round: losersRound,
            team1Seed: null,
            team2Seed: null,
            sourceMatch1: { matchIndex: r0Losers[i * 2]!, bracket: "winners", takesWinner: false },
            sourceMatch2: { matchIndex: r0Losers[i * 2 + 1]!, bracket: "winners", takesWinner: false },
        });
        prevLosersMatchIndices.push(losersMatchIndex);
        losersMatchIndex++;
    }
    losersRound++;

    // Continue building losers bracket
    for (let winnersRound = 1; winnersRound < numRounds; winnersRound++) {
        const winnersDropouts = winnersMatchesByRound[winnersRound] || [];

        // Round X: Previous losers winners vs winners dropouts
        const matchesThisRound: number[] = [];
        const numMatches = Math.min(prevLosersMatchIndices.length, winnersDropouts.length);

        for (let i = 0; i < numMatches; i++) {
            // Reverse the order of dropouts to maintain bracket balance
            const dropoutIdx = winnersDropouts.length - 1 - i;
            losers.push({
                matchIndex: losersMatchIndex,
                bracket: "losers",
                round: losersRound,
                team1Seed: null,
                team2Seed: null,
                sourceMatch1: { matchIndex: prevLosersMatchIndices[i]!, bracket: "losers", takesWinner: true },
                sourceMatch2: { matchIndex: winnersDropouts[dropoutIdx]!, bracket: "winners", takesWinner: false },
            });
            matchesThisRound.push(losersMatchIndex);
            losersMatchIndex++;
        }
        losersRound++;

        // If more than 1 match, add a consolidation round
        if (matchesThisRound.length > 1) {
            const consolidationMatches: number[] = [];
            const numConsolidation = matchesThisRound.length / 2;

            for (let i = 0; i < numConsolidation; i++) {
                losers.push({
                    matchIndex: losersMatchIndex,
                    bracket: "losers",
                    round: losersRound,
                    team1Seed: null,
                    team2Seed: null,
                    sourceMatch1: { matchIndex: matchesThisRound[i * 2]!, bracket: "losers", takesWinner: true },
                    sourceMatch2: { matchIndex: matchesThisRound[i * 2 + 1]!, bracket: "losers", takesWinner: true },
                });
                consolidationMatches.push(losersMatchIndex);
                losersMatchIndex++;
            }
            losersRound++;
            prevLosersMatchIndices = consolidationMatches;
        } else {
            prevLosersMatchIndices = matchesThisRound;
        }
    }

    const losersFinalMatchIndex = losersMatchIndex - 1;

    // ============ GRAND FINAL ============
    const grandFinal: BracketMatch[] = [];

    // Grand Final Match 1: Winners final winner vs Losers final winner
    grandFinal.push({
        matchIndex: 0,
        bracket: "grand_final",
        round: 0,
        team1Seed: null,
        team2Seed: null,
        sourceMatch1: { matchIndex: winnersFinalMatchIndex, bracket: "winners", takesWinner: true },
        sourceMatch2: { matchIndex: losersFinalMatchIndex, bracket: "losers", takesWinner: true },
    });

    // Grand Final Reset (if enabled): Only played if losers bracket champion wins GF1
    if (winnerTakesAll) {
        grandFinal.push({
            matchIndex: 1,
            bracket: "grand_final",
            round: 1,
            team1Seed: null,
            team2Seed: null,
            // Both teams come from GF0 - winner and loser swap for reset
            sourceMatch1: { matchIndex: 0, bracket: "grand_final", takesWinner: true },
            sourceMatch2: { matchIndex: 0, bracket: "grand_final", takesWinner: false },
        });
    }

    return { winners, losers, grandFinal, roundrobin: [] };
}

/**
 * Generate round robin bracket using the circle method algorithm
 *
 * For n teams:
 * 1. If n is odd, add a "bye" placeholder (n+1 positions)
 * 2. Fix position 0, rotate positions 1 to n-1 clockwise each round
 * 3. Pair: position[0] vs position[n-1], position[1] vs position[n-2], etc.
 * 4. Skip matches involving the bye placeholder
 *
 * @param numTeams - Number of teams
 * @returns Array of round robin matches
 */
function generateRoundRobinBracket(numTeams: number): BracketMatch[] {
    if (numTeams < 2) return [];

    const matches: BracketMatch[] = [];

    // If odd number of teams, add a phantom team for bye handling
    const isOdd = numTeams % 2 !== 0;
    const n = isOdd ? numTeams + 1 : numTeams;

    // Create initial positions (1 to n, where n might be a "bye" if odd)
    // We use seeds 1-numTeams, and n represents bye if odd
    const positions: number[] = [];
    for (let i = 1; i <= n; i++) {
        positions.push(i);
    }

    const numRounds = n - 1;
    const matchesPerRound = n / 2;
    let matchIndex = 0;

    for (let round = 0; round < numRounds; round++) {
        // Generate pairings for this round
        for (let i = 0; i < matchesPerRound; i++) {
            const pos1 = positions[i]!;
            const pos2 = positions[n - 1 - i]!;

            // Skip if either position is the bye (phantom team)
            if (isOdd && (pos1 > numTeams || pos2 > numTeams)) {
                continue;
            }

            matches.push({
                matchIndex,
                bracket: "roundrobin",
                round,
                team1Seed: pos1,
                team2Seed: pos2,
            });
            matchIndex++;
        }

        // Rotate positions (keep position 0 fixed, rotate 1 to n-1)
        // Circle method: last element moves to position 1, all others shift right
        const last = positions.pop()!;
        positions.splice(1, 0, last);
    }

    return matches;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a match is a bye (one team has a seed, the other is null with no source match)
 */
export function isByeMatch(match: BracketMatch): boolean {
    const team1IsBye = match.team1Seed === null && match.sourceMatch1 === undefined;
    const team2IsBye = match.team2Seed === null && match.sourceMatch2 === undefined;
    return (team1IsBye && match.team2Seed !== null) || (team2IsBye && match.team1Seed !== null);
}

/**
 * Get the seed that advances from a bye match
 */
export function getByeSeed(match: BracketMatch): number | null {
    if (!isByeMatch(match)) return null;
    if (match.team1Seed !== null && match.team2Seed === null) return match.team1Seed;
    if (match.team2Seed !== null && match.team1Seed === null) return match.team2Seed;
    return null;
}

/**
 * Get all matches from a generated bracket as a flat array
 */
export function getAllMatches(bracket: GeneratedBracket): BracketMatch[] {
    return [...bracket.winners, ...bracket.losers, ...bracket.grandFinal, ...bracket.roundrobin];
}

/**
 * Get matches for a specific bracket and round
 */
export function getMatchesByBracketAndRound(
    bracket: GeneratedBracket,
    bracketType: MatchBracket,
    round: number,
    excludeByes: boolean = true
): BracketMatch[] {
    let matches: BracketMatch[];

    switch (bracketType) {
        case "winners":
            matches = bracket.winners;
            break;
        case "losers":
            matches = bracket.losers;
            break;
        case "grand_final":
            matches = bracket.grandFinal;
            break;
        default:
            return [];
    }

    return matches.filter(m => m.round === round && (!excludeByes || !isByeMatch(m)));
}

/**
 * Get the number of rounds in a bracket section
 */
export function getNumRounds(matches: BracketMatch[]): number {
    if (matches.length === 0) return 0;
    return Math.max(...matches.map(m => m.round)) + 1;
}

/**
 * Get display rounds (rounds with non-bye matches)
 */
export function getDisplayRounds(matches: BracketMatch[]): number[] {
    const numRounds = getNumRounds(matches);
    return Array.from({ length: numRounds }, (_, i) => i)
        .filter(round => matches.some(m => m.round === round && !isByeMatch(m)));
}

// ============================================================================
// MATCH NAMING
// ============================================================================

/**
 * Map winners bracket round to grid column for DE
 */
export function getWinnersColumnForRound(winnersRound: number, _numRounds?: number): number {
    if (winnersRound === 0) return 1;
    return winnersRound * 2;
}

/**
 * Map losers bracket round to grid column for DE
 */
export function getLosersColumnForRound(losersRound: number): number {
    return losersRound + 2;
}

/**
 * Generate a match letter suffix (A, B, C, ... Z, AA, AB, etc.)
 */
export function getMatchLetterSuffix(matchIdxInRound: number): string {
    const repeatCount = Math.floor(matchIdxInRound / 26) + 1;
    const charCode = 65 + (matchIdxInRound % 26);
    return String.fromCharCode(charCode).repeat(repeatCount);
}

/**
 * Get match name for single elimination
 */
export function getSingleEliminationMatchName(
    match: BracketMatch,
    displayRoundIdx: number,
    matchIdxInRound: number,
    totalDisplayRounds: number
): string {
    if (displayRoundIdx === totalDisplayRounds - 1) {
        return 'Final';
    }
    const roundNumber = displayRoundIdx + 1;
    const letter = getMatchLetterSuffix(matchIdxInRound);
    return `SE${roundNumber}-${letter}`;
}

/**
 * Get match name for double elimination
 */
export function getDoubleEliminationMatchName(
    match: BracketMatch,
    matchIdxInRound: number,
    bracket: GeneratedBracket,
    bracketSize: number
): string {
    const numRounds = Math.ceil(Math.log2(bracketSize));

    if (match.bracket === "grand_final") {
        return match.matchIndex === 0 ? "Finals" : "Reset";
    }

    if (match.bracket === "winners") {
        const col = getWinnersColumnForRound(match.round, numRounds);
        const winnersRounds = [...new Set(bracket.winners.map(m => m.round))].sort((a, b) => a - b);

        if (match.round === winnersRounds[winnersRounds.length - 1]) {
            return `DE${col}-WF`;
        }

        const letter = getMatchLetterSuffix(matchIdxInRound);
        return `DE${col}-W${letter}`;
    }

    if (match.bracket === "losers") {
        const col = getLosersColumnForRound(match.round);
        const losersRounds = [...new Set(bracket.losers.map(m => m.round))].sort((a, b) => a - b);

        if (match.round === losersRounds[losersRounds.length - 1]) {
            return `DE${col}-LF`;
        }

        const letter = getMatchLetterSuffix(matchIdxInRound);
        return `DE${col}-L${letter}`;
    }

    return `Match ${match.matchIndex + 1}`;
}

/**
 * Get round title for single elimination
 */
export function getSingleEliminationRoundTitle(displayRoundIdx: number, totalDisplayRounds: number): string {
    if (displayRoundIdx === totalDisplayRounds - 1) {
        return 'Finals';
    }
    return `SE${displayRoundIdx + 1}`;
}

/**
 * Get match name for round robin
 */
export function getRoundRobinMatchName(match: BracketMatch, matchIdxInRound: number): string {
    const roundNumber = match.round + 1;
    const letter = getMatchLetterSuffix(matchIdxInRound);
    return `RR${roundNumber}-${letter}`;
}

/**
 * Get round title for round robin
 */
export function getRoundRobinRoundTitle(round: number): string {
    return `RR${round + 1}`;
}

/**
 * Get number of rounds in a round robin tournament
 */
export function getRoundRobinNumRounds(numTeams: number): number {
    if (numTeams < 2) return 0;
    // If odd, n-1 rounds where n = numTeams + 1 (for bye)
    // If even, n-1 rounds where n = numTeams
    const n = numTeams % 2 === 0 ? numTeams : numTeams + 1;
    return n - 1;
}

/**
 * Get total number of games in a round robin tournament
 */
export function getRoundRobinTotalGames(numTeams: number): number {
    if (numTeams < 2) return 0;
    // n*(n-1)/2 for each team plays every other team once
    return (numTeams * (numTeams - 1)) / 2;
}

// ============================================================================
// GRID LAYOUT HELPERS (Double Elimination)
// ============================================================================

export interface DEGridDimensions {
    totalCols: number;
    totalRows: number;
    winnersRows: number;
    losersRows: number;
}

export interface DEGridPosition {
    col: number;
    rowStart: number;
    rowSpan: number;
}

/**
 * Calculate grid dimensions for double elimination bracket
 */
export function getDoubleEliminationGridDimensions(
    bracketSize: number,
    winnerTakesAll: boolean
): DEGridDimensions {
    const numRounds = Math.ceil(Math.log2(bracketSize));
    const fullBracketSize = Math.pow(2, numRounds);

    // Losers bracket has 2*(numRounds-1) rounds for brackets >= 4 teams
    const losersRoundCount = Math.max(1, 2 * (numRounds - 1));

    // Total columns: 1 (W1) + losersRounds + 1 (Finals) + (1 if reset)
    const totalCols = 1 + losersRoundCount + 1 + (winnerTakesAll ? 1 : 0);

    // Rows: Winners portion + Losers portion
    const winnersFirstRoundMatches = fullBracketSize / 2;
    const winnersRows = winnersFirstRoundMatches * 2;

    // Losers: needs enough rows for the largest losers round
    const losersFirstRoundMatches = Math.max(1, fullBracketSize / 4);
    const losersRows = Math.max(2, losersFirstRoundMatches * 2);

    return {
        totalCols,
        totalRows: winnersRows + losersRows,
        winnersRows,
        losersRows,
    };
}

/**
 * Get grid position for a double elimination match
 */
export function getDoubleEliminationGridPosition(
    match: BracketMatch,
    bracket: GeneratedBracket,
    bracketSize: number,
    winnerTakesAll: boolean
): DEGridPosition {
    const numRounds = Math.ceil(Math.log2(bracketSize));
    const dims = getDoubleEliminationGridDimensions(bracketSize, winnerTakesAll);

    if (match.bracket === "winners") {
        const col = getWinnersColumnForRound(match.round, numRounds);

        // Calculate row position based on match index within the round
        const matchesInRound = bracket.winners.filter(m => m.round === match.round && !isByeMatch(m));
        const matchIdxInRound = matchesInRound.findIndex(m => m.matchIndex === match.matchIndex);

        const totalMatchesInRound = matchesInRound.length;
        const rowSpan = Math.max(1, Math.floor(dims.winnersRows / totalMatchesInRound));
        const rowStart = matchIdxInRound * rowSpan + 1;

        return { col, rowStart, rowSpan };
    }

    if (match.bracket === "losers") {
        const col = getLosersColumnForRound(match.round);

        // Row position: starts after winners rows
        const matchesInRound = bracket.losers.filter(m => m.round === match.round);
        const matchIdxInRound = matchesInRound.findIndex(m => m.matchIndex === match.matchIndex);

        const totalMatchesInRound = matchesInRound.length;
        const availableRows = dims.losersRows;
        const rowSpan = Math.max(1, Math.floor(availableRows / Math.max(1, totalMatchesInRound)));
        const rowStart = dims.winnersRows + matchIdxInRound * rowSpan + 1;

        return { col, rowStart, rowSpan };
    }

    if (match.bracket === "grand_final") {
        // Grand final: after all losers rounds
        const losersRoundCount = Math.max(1, 2 * (numRounds - 1));
        const col = losersRoundCount + 2 + match.matchIndex;

        // Grand final spans bridging winners and losers
        const rowStart = Math.max(1, Math.floor(dims.winnersRows / 2) + 1);
        const rowSpan = Math.max(2, Math.floor(dims.totalRows / 2));

        return { col, rowStart, rowSpan };
    }

    // Fallback
    return { col: 1, rowStart: 1, rowSpan: 1 };
}

/**
 * Get column header labels for double elimination grid
 */
export function getDoubleEliminationColumnHeaders(bracketSize: number, winnerTakesAll: boolean): string[] {
    const numRounds = Math.ceil(Math.log2(bracketSize));
    const losersRoundCount = Math.max(1, 2 * (numRounds - 1));

    const headers: string[] = [];

    // Round 1 through Round N (where N = losersRoundCount + 1)
    for (let i = 1; i <= losersRoundCount + 1; i++) {
        headers.push(`DE ${i}`);
    }

    // Finals column
    headers.push('Finals');

    // Reset column if enabled
    if (winnerTakesAll) {
        headers.push('Finals-2');
    }

    return headers;
}
