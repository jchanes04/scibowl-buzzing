/**
 * Bracket state store for tournament bracket management
 *
 * Handles pending seed assignments, bracket size selection, bracket operations,
 * and bracket match generation/display logic.
 * Works in conjunction with tournament.svelte.ts for full tournament context.
 */
import { api } from '../../../convex/_generated/api';
import { tournamentStore, tournamentTeamsStore, tournamentGamesStore } from './tournament.svelte';
import { calculateTeamScore } from '$lib/functions/scoreboard';
import { toastStore } from './toast.svelte';
import type { BracketSeed, TournamentTeam, TournamentGame, BracketResult, BracketType, MatchBracket, SourceMatch, BracketMatch } from '../../routes/(app)/tournament/[id]/types';

// Re-export BracketMatch for consumers
export type { BracketMatch };

export interface TeamSlot {
    display: string;
    isWinner: boolean;
    isEditable: boolean;
    seed: number | null;
    currentTeamId: string | null;
    score: number | null;
}

// Bracket editing state
let _selectedBracketSize = $state(0);
let _selectedBracketType = $state<BracketType>("single");
let _selectedGrandFinalReset = $state(true);
let _pendingSeeds = $state<Map<string, number | null>>(new Map());

// Track initialization
let isInitialized = $state(false);

/**
 * Initialize bracket store with default size
 */
export function initBracketStore() {
    if (isInitialized) return;
    isInitialized = true;

    // Immediate check in case data is already loaded
    const tournament = tournamentStore.value;
    if (tournament.bracketConfirmed && tournament.bracketSize) {
        _selectedBracketSize = tournament.bracketSize;
    }
    if (tournament.bracketType) {
        _selectedBracketType = tournament.bracketType;
    }
    if (tournament.grandFinalReset !== undefined) {
        _selectedGrandFinalReset = tournament.grandFinalReset;
    }

    // Reactively update bracket size from tournament or teams
    $effect(() => {
        const t = tournamentStore.value;
        const teams = tournamentTeamsStore.value;

        // If bracket is confirmed, always enforce the saved settings
        if (t.bracketConfirmed) {
            if (t.bracketSize && _selectedBracketSize !== t.bracketSize) {
                _selectedBracketSize = t.bracketSize;
            }
            if (t.bracketType && _selectedBracketType !== t.bracketType) {
                _selectedBracketType = t.bracketType;
            }
            if (t.grandFinalReset !== undefined && _selectedGrandFinalReset !== t.grandFinalReset) {
                _selectedGrandFinalReset = t.grandFinalReset;
            }
        }
        // Initialize only when tournament data is loaded (id exists)
        else if (t.id) {
            if (_selectedBracketSize === 0) {
                if (t.bracketSize) {
                    _selectedBracketSize = t.bracketSize;
                } else if (teams.length > 0) {
                    _selectedBracketSize = teams.length;
                }
            }
            if (t.bracketType) {
                _selectedBracketType = t.bracketType;
            }
            if (t.grandFinalReset !== undefined) {
                _selectedGrandFinalReset = t.grandFinalReset;
            }
        }
    });
}

/**
 * Clear bracket store state
 */
export function clearBracketStore() {
    _selectedBracketSize = 0;
    _selectedBracketType = "single";
    _selectedGrandFinalReset = true;
    _pendingSeeds = new Map();
    isInitialized = false;
}

/**
 * Bracket size store
 */
export const bracketSizeStore = {
    get value(): number {
        return _selectedBracketSize;
    },
    set value(size: number) {
        _selectedBracketSize = size;
    },
};

/**
 * Bracket type store (single or double elimination)
 */
export const bracketTypeStore = {
    get value(): BracketType {
        return _selectedBracketType;
    },
    set value(type: BracketType) {
        _selectedBracketType = type;
    },
};

/**
 * Grand final reset store (for double elimination)
 */
export const grandFinalResetStore = {
    get value(): boolean {
        return _selectedGrandFinalReset;
    },
    set value(reset: boolean) {
        _selectedGrandFinalReset = reset;
    },
};

/**
 * Pending seeds store
 */
export const pendingSeedsStore = {
    get value(): Map<string, number | null> {
        return _pendingSeeds;
    },
    get size(): number {
        return _pendingSeeds.size;
    },
    has(teamId: string): boolean {
        return _pendingSeeds.has(teamId);
    },
    get(teamId: string): number | null | undefined {
        return _pendingSeeds.get(teamId);
    },
};


/**
 * Check if there are unsaved changes
 */
export const hasUnsavedChanges = {
    get value(): boolean {
        const tournament = tournamentStore.value;
        const teams = tournamentTeamsStore.value;

        if (_pendingSeeds.size > 0) return true;
        if (_selectedBracketSize !== (tournament.bracketSize || teams.length)) return true;
        if (_selectedBracketType !== (tournament.bracketType || "single")) return true;
        if (_selectedGrandFinalReset !== (tournament.grandFinalReset ?? true)) return true;
        return false;
    },
};

/**
 * Get team's current seed (considering pending changes)
 */
export function getTeamSeed(teamId: string): number | null {
    if (_pendingSeeds.has(teamId)) {
        return _pendingSeeds.get(teamId) ?? null;
    }
    const tournament = tournamentStore.value;
    const savedSeed = tournament.bracketSeeds?.find((s: BracketSeed) => s.teamId === teamId);
    return savedSeed ? savedSeed.seed : null;
}

/**
 * Get team at a specific seed (considering pending changes)
 */
export function getTeamAtSeed(seed: number): TournamentTeam | null | undefined {
    const teams = tournamentTeamsStore.value;
    const tournament = tournamentStore.value;

    // 1. Check if any team has this seed pending
    for (const [teamId, pendingSeed] of _pendingSeeds.entries()) {
        if (pendingSeed === seed) {
            return teams.find((t: TournamentTeam) => t.teamId === teamId);
        }
    }

    // 2. Check saved seeds (ensure team hasn't been moved in pending)
    const savedSeedData = tournament.bracketSeeds?.find((s: BracketSeed) => s.seed === seed);

    if (savedSeedData) {
        const teamId = savedSeedData.teamId;
        // If this team has a pending change to a DIFFERENT seed, then it's not here
        if (_pendingSeeds.has(teamId)) {
            return null;
        }
        return teams.find((t: TournamentTeam) => t.teamId === teamId);
    }

    return null;
}

/**
 * Get team name by ID
 */
export function getTeamName(teamId: string): string {
    const teams = tournamentTeamsStore.value;
    const team = teams.find((t: TournamentTeam) => t.teamId === teamId);
    return team ? team.name : 'Unknown Team';
}

/**
 * Get all seeds including pending changes
 * Only returns seeds within the current bracket size range (1 to bracketSize)
 */
export function getCurrentSeeds(): Array<{ seed: number; teamId: string }> {
    const tournament = tournamentStore.value;
    const seeds: Array<{ seed: number; teamId: string }> = [];
    const savedSeeds = tournament.bracketSeeds || [];

    // Start with saved seeds (only those within current bracket size)
    for (const s of savedSeeds) {
        if (!_pendingSeeds.has(s.teamId) && s.seed >= 1 && s.seed <= _selectedBracketSize) {
            seeds.push(s);
        }
    }

    // Apply pending changes
    for (const [teamId, seed] of _pendingSeeds) {
        if (seed !== null && seed >= 1 && seed <= _selectedBracketSize) {
            // Remove any existing seed at this position
            const filtered = seeds.filter((s) => s.seed !== seed && s.teamId !== teamId);
            filtered.push({ seed, teamId });
            seeds.length = 0;
            seeds.push(...filtered);
        }
    }

    return seeds.sort((a, b) => a.seed - b.seed);
}

/**
 * Handle seed selection change (stores locally)
 */
export function handleSeedChange(teamId: string, seedValue: string) {
    const newSeed = seedValue ? parseInt(seedValue) : null;
    const tournament = tournamentStore.value;
    const savedSeed = tournament.bracketSeeds?.find((s) => s.teamId === teamId);
    const currentSaved = savedSeed?.seed ?? null;

    if (newSeed === currentSaved) {
        // Remove from pending if it matches the saved value
        _pendingSeeds.delete(teamId);
        _pendingSeeds = new Map(_pendingSeeds);
    } else {
        _pendingSeeds.set(teamId, newSeed);
        _pendingSeeds = new Map(_pendingSeeds);
    }
}

/**
 * Cancel pending changes
 */
export function cancelPendingChanges() {
    const tournament = tournamentStore.value;
    const teams = tournamentTeamsStore.value;

    _pendingSeeds = new Map();
    _selectedBracketSize = tournament.bracketSize || teams.length;
    _selectedBracketType = tournament.bracketType || "single";
    _selectedGrandFinalReset = tournament.grandFinalReset ?? true;
}

/**
 * Randomize seeds - shuffle teams and assign to seed positions
 */
export function randomizeSeeds() {
    const teams = tournamentTeamsStore.value;
    if (teams.length === 0) return;

    // Fisher-Yates shuffle
    const shuffled = [...teams];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }

    // Assign shuffled teams to seeds 1 through N
    const newPendingSeeds = new Map<string, number | null>();
    const numSeeds = Math.min(shuffled.length, _selectedBracketSize);
    for (let i = 0; i < numSeeds; i++) {
        newPendingSeeds.set(shuffled[i]!.teamId, i + 1);
    }

    _pendingSeeds = newPendingSeeds;
    toastStore.add('Seeds randomized!');
}

/**
 * Save bracket structure (seeds and size) without creating games
 * Returns true on success, false on failure
 */
export async function saveBracketStructure(convex: any): Promise<boolean> {
    const tournament = tournamentStore.value;

    try {
        toastStore.add('Saving structure...', 'info', 1000);

        const seeds = getCurrentSeeds();

        await convex.mutation(api.tournaments.saveBracketStructure, {
            tournamentId: tournament.id,
            bracketSeeds: seeds,
            bracketSize: _selectedBracketSize,
            bracketType: _selectedBracketType,
            grandFinalReset: _selectedGrandFinalReset,
        });

        _pendingSeeds = new Map();
        toastStore.add('Structure saved successfully!', 'success');
        return true;
    } catch (error) {
        toastStore.add(`Error saving structure: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        return false;
    }
}

/**
 * Confirm bracket structure and create games
 */
export async function confirmBracketStructure(convex: any) {
    const tournament = tournamentStore.value;
    const seeds = getCurrentSeeds();

    if (seeds.length !== _selectedBracketSize) {
        toastStore.add(`Please assign all ${_selectedBracketSize} seeds before confirming`, 'warning');
        return;
    }

    // Double elimination requires power of 2 bracket size
    if (_selectedBracketType === "double") {
        const isPowerOfTwo = _selectedBracketSize > 0 && (_selectedBracketSize & (_selectedBracketSize - 1)) === 0;
        if (!isPowerOfTwo) {
            toastStore.add('Double elimination brackets require a power of 2 number of teams (2, 4, 8, 16, etc.)', 'error');
            return;
        }
    }

    const bracketTypeName = _selectedBracketType === "double" ? "Double Elimination" : "Single Elimination";
    const resetInfo = _selectedBracketType === "double" ? (_selectedGrandFinalReset ? " with bracket reset" : " without bracket reset") : "";

    if (
        !confirm(
            `This will lock the ${bracketTypeName} bracket${resetInfo} with ${_selectedBracketSize} teams and create all games. This cannot be undone. Continue?`
        )
    ) {
        return;
    }

    try {
        toastStore.add('Creating games...', 'info', 2000);

        // First save any pending changes
        const needsSave = _pendingSeeds.size > 0 ||
            _selectedBracketSize !== tournament.bracketSize ||
            _selectedBracketType !== (tournament.bracketType || "single") ||
            _selectedGrandFinalReset !== (tournament.grandFinalReset ?? true);

        if (needsSave) {
            const saveSuccess = await saveBracketStructure(convex);
            if (!saveSuccess) {
                toastStore.add('Cannot confirm bracket - save failed', 'error');
                return;
            }
        }

        // Then confirm the structure
        await convex.mutation(api.tournaments.confirmBracketStructure, {
            tournamentId: tournament.id,
        });

        toastStore.add(`Structure confirmed! Games created for ${bracketTypeName} bracket.`, 'success');
    } catch (error) {
        toastStore.add(`Error confirming structure: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
}

// --- Bracket Match Generation ---

/**
 * Generate seed positions using standard tournament bracket seeding
 * (1 vs 16, 8 vs 9, etc. pattern)
 */
function generateSeedPositions(bracketSize: number): number[] {
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

/**
 * Generate all bracket matches for a given bracket size (single elimination)
 * Returns unified BracketMatch format with bracket: "winners"
 */
function generateBracketMatches(bracketSize: number): BracketMatch[] {
    if (bracketSize < 2) return [];

    const matches: BracketMatch[] = [];
    const numRounds = Math.ceil(Math.log2(bracketSize));
    const fullBracketSize = Math.pow(2, numRounds);

    let matchIndex = 0;
    const firstRoundMatches = fullBracketSize / 2;
    const seedPositions = generateSeedPositions(fullBracketSize);

    // Generate first round matches
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
 * Generate all bracket matches for double elimination
 */
function generateDoubleEliminationMatches(bracketSize: number, grandFinalReset: boolean = true): {
    winners: BracketMatch[];
    losers: BracketMatch[];
    grandFinal: BracketMatch[];
} {
    if (bracketSize < 2) return { winners: [], losers: [], grandFinal: [] };

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

    // Track matches by round for winners
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

        // Previous losers winners vs winners dropouts
        const matchesThisRound: number[] = [];
        const numMatches = Math.min(prevLosersMatchIndices.length, winnersDropouts.length);

        for (let i = 0; i < numMatches; i++) {
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

        // Consolidation round if needed
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

    grandFinal.push({
        matchIndex: 0,
        bracket: "grand_final",
        round: 0,
        team1Seed: null,
        team2Seed: null,
        sourceMatch1: { matchIndex: winnersFinalMatchIndex, bracket: "winners", takesWinner: true },
        sourceMatch2: { matchIndex: losersFinalMatchIndex, bracket: "losers", takesWinner: true },
    });

    if (grandFinalReset) {
        grandFinal.push({
            matchIndex: 1,
            bracket: "grand_final",
            round: 1,
            team1Seed: null,
            team2Seed: null,
            sourceMatch1: { matchIndex: 0, bracket: "grand_final", takesWinner: true },
            sourceMatch2: { matchIndex: 0, bracket: "grand_final", takesWinner: false },
        });
    }

    return { winners, losers, grandFinal };
}

// --- Bracket Matches Store ---

/**
 * Store for computed bracket match data (single elimination)
 */
export const bracketMatchesStore = {
    get matches(): BracketMatch[] {
        return generateBracketMatches(_selectedBracketSize);
    },
    get numRounds(): number {
        const matches = this.matches;
        return matches.length > 0 ? (matches[matches.length - 1]?.round ?? -1) + 1 : 0;
    },
    get firstRoundMatchCount(): number {
        return this.numRounds > 0 ? Math.pow(2, this.numRounds - 1) : 0;
    },
    get totalGridRows(): number {
        return this.firstRoundMatchCount;
    },
};

/**
 * Store for double elimination bracket data
 */
export const doubleEliminationStore = {
    get brackets(): { winners: BracketMatch[]; losers: BracketMatch[]; grandFinal: BracketMatch[] } {
        return generateDoubleEliminationMatches(_selectedBracketSize, _selectedGrandFinalReset);
    },
    get winners(): BracketMatch[] {
        return this.brackets.winners;
    },
    get losers(): BracketMatch[] {
        return this.brackets.losers;
    },
    get grandFinal(): BracketMatch[] {
        return this.brackets.grandFinal;
    },
    get allMatches(): BracketMatch[] {
        const b = this.brackets;
        return [...b.winners, ...b.losers, ...b.grandFinal];
    },
    get winnersNumRounds(): number {
        const matches = this.winners;
        return matches.length > 0 ? (matches[matches.length - 1]?.round ?? -1) + 1 : 0;
    },
    get losersNumRounds(): number {
        const matches = this.losers;
        return matches.length > 0 ? (matches[matches.length - 1]?.round ?? -1) + 1 : 0;
    },
};

/**
 * Get all matches for the current bracket type
 */
export function getAllMatches(): BracketMatch[] {
    if (_selectedBracketType === "double") {
        return doubleEliminationStore.allMatches;
    }
    return bracketMatchesStore.matches;
}

// --- Match Helper Functions ---

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
 * Get the bye seed from a source match reference
 */
export function getByeSeedFromSource(source: SourceMatch | undefined): number | null {
    if (source === undefined) return null;
    const allMatches = getAllMatches();
    const sourceMatch = allMatches.find((m) => m.matchIndex === source.matchIndex && m.bracket === source.bracket);
    return sourceMatch ? getByeSeed(sourceMatch) : null;
}

/**
 * Get non-bye matches for a specific round
 */
export function getMatchesByRound(round: number): BracketMatch[] {
    return bracketMatchesStore.matches.filter((m) => m.round === round && !isByeMatch(m));
}

/**
 * Check if a round has any non-bye matches
 */
export function roundHasMatches(round: number): boolean {
    return bracketMatchesStore.matches.some((m) => m.round === round && !isByeMatch(m));
}

/**
 * Get rounds that have non-bye matches (for display)
 */
export function getDisplayRounds(): number[] {
    const numRounds = bracketMatchesStore.numRounds;
    return Array.from({ length: numRounds }, (_, i) => i).filter((round) => roundHasMatches(round));
}

/**
 * Get the first displayed round index
 */
export function getFirstDisplayedRound(): number {
    const displayRounds = getDisplayRounds();
    return displayRounds.length > 0 ? displayRounds[0]! : 0;
}

/**
 * Get the pair index for a first-round match
 */
export function getFirstRoundPairIndex(match: BracketMatch): number {
    return Math.floor(match.matchIndex / 2);
}

/**
 * Group first-round displayed matches by their pair
 */
export function getFirstRoundPairs(): Map<number, BracketMatch[]> {
    const pairs = new Map<number, BracketMatch[]>();
    const firstRoundDisplayed = getMatchesByRound(0);

    for (const match of firstRoundDisplayed) {
        const pairIdx = getFirstRoundPairIndex(match);
        if (!pairs.has(pairIdx)) {
            pairs.set(pairIdx, []);
        }
        pairs.get(pairIdx)!.push(match);
    }

    return pairs;
}

/**
 * Get grid position for a match based on bracket structure
 */
export function getMatchGridPosition(match: BracketMatch): { start: number; end: number } {
    const matches = bracketMatchesStore.matches;

    if (match.round === 0) {
        const pairIdx = getFirstRoundPairIndex(match);
        const start = pairIdx * 2 + 1;
        const end = start + 2;
        return { start, end };
    }

    const source1 = match.sourceMatch1 ? matches.find((m) => m.matchIndex === match.sourceMatch1!.matchIndex && m.bracket === match.sourceMatch1!.bracket) : undefined;
    const source2 = match.sourceMatch2 ? matches.find((m) => m.matchIndex === match.sourceMatch2!.matchIndex && m.bracket === match.sourceMatch2!.bracket) : undefined;

    if (source1 && source2) {
        const pos1 = getMatchGridPosition(source1);
        const pos2 = getMatchGridPosition(source2);
        return { start: pos1.start, end: pos2.end };
    }

    return { start: 1, end: 3 };
}

// --- Match Naming ---

/**
 * Get match name (SE1-A, SE1-B, etc. or "Final" for finals)
 */
export function getMatchName(match: BracketMatch, displayRoundIdx: number, matchIdxInRound: number): string {
    const displayRounds = getDisplayRounds();
    if (displayRoundIdx === displayRounds.length - 1) {
        return 'Final';
    }
    const roundNumber = displayRoundIdx + 1;
    const repeatCount = Math.floor(matchIdxInRound / 26) + 1;
    const charCode = 65 + (matchIdxInRound % 26);
    const letter = String.fromCharCode(charCode).repeat(repeatCount);
    return `SE${roundNumber}-${letter}`;
}

/**
 * Get match name by match index and bracket (for "Winner of X" display)
 * Uses appropriate naming based on bracket type
 */
export function getMatchNameByIndex(matchIndex: number, bracket: MatchBracket = "winners"): string {
    // For double elimination with losers/grand_final, use DE naming
    if (_selectedBracketType === "double" && bracket !== "winners") {
        return getDoubleEliminationMatchNameByIndex(matchIndex, bracket);
    }

    // For single elimination or winners bracket
    if (_selectedBracketType === "double") {
        return getDoubleEliminationMatchNameByIndex(matchIndex, bracket);
    }

    // Single elimination naming
    const matches = bracketMatchesStore.matches;
    const displayRounds = getDisplayRounds();
    const match = matches.find((m) => m.matchIndex === matchIndex);
    if (!match) return `Match ${matchIndex + 1}`;

    const displayRoundIdx = displayRounds.indexOf(match.round);
    if (displayRoundIdx === -1) {
        return `Match ${matchIndex + 1}`;
    }

    const matchesInRound = getMatchesByRound(match.round);
    const matchIdxInRound = matchesInRound.findIndex((m) => m.matchIndex === matchIndex);

    return getMatchName(match, displayRoundIdx, matchIdxInRound);
}

/**
 * Get round title (SE1, SE2, etc. or "Finals")
 */
export function getRoundTitle(displayRoundIdx: number): string {
    const displayRounds = getDisplayRounds();
    if (displayRoundIdx === displayRounds.length - 1) {
        return 'Finals';
    }
    return `SE${displayRoundIdx + 1}`;
}

// --- Winner/Result Logic ---

/**
 * Get game for a match (unified for both bracket types)
 * For single elimination, bracket defaults to "winners"
 */
export function getGame(matchIndex: number, bracket: MatchBracket = "winners"): TournamentGame | undefined {
    const games = tournamentGamesStore.value;
    return games.find((g: TournamentGame) =>
        g.tournamentMatchIndex === matchIndex &&
        (g.tournamentMatchBracket || "winners") === bracket
    );
}

/**
 * Check if a match is currently live
 */
export function isMatchLive(matchIndex: number, bracket: MatchBracket = "winners"): boolean {
    const game = getGame(matchIndex, bracket);
    return !!(Object.keys(game?.teamNames ?? {}).length > 0
        && game?.isActive
        && !game?.isCompleted);
}

/**
 * Get team score for a specific match (only if team has joined)
 */
export function getTeamScoreForMatch(matchIndex: number, bracket: MatchBracket, teamId: string): number | null {
    const game = getGame(matchIndex, bracket);
    if (!game || !game.scores || !game.pointValues) return null;
    if (!game.teamNames || !(teamId in game.teamNames)) return null;
    return calculateTeamScore(teamId, game.scores, game.pointValues);
}

/**
 * Get the winner of a match (unified for both bracket types)
 */
export function getMatchWinner(matchIndex: number, bracket: MatchBracket = "winners"): string | null {
    const tournament = tournamentStore.value;
    const allMatches = getAllMatches();

    // Check stored results
    const result = tournament.bracketResults?.find((r: BracketResult) =>
        r.matchIndex === matchIndex && (r.bracket || "winners") === bracket
    );
    if (result) return result.winningTeamId;

    // Auto-advance byes
    const match = allMatches.find((m) => m.matchIndex === matchIndex && m.bracket === bracket);
    if (match) {
        if (match.team1Seed !== null && match.team2Seed === null) {
            if (match.sourceMatch2 === undefined) return getTeamAtSeed(match.team1Seed)?.teamId || null;
        }
        if (match.team1Seed === null && match.team2Seed !== null) {
            if (match.sourceMatch1 === undefined) return getTeamAtSeed(match.team2Seed)?.teamId || null;
        }
    }
    return null;
}

/**
 * Get the loser of a match (for losers bracket advancement in double elimination)
 */
export function getMatchLoser(matchIndex: number, bracket: MatchBracket): string | null {
    const winnerId = getMatchWinner(matchIndex, bracket);
    if (!winnerId) return null;

    // Get both teams in the match and return the one that's not the winner
    const teamsInMatch = getTeamsForMatch(matchIndex, bracket);
    const loser = teamsInMatch.find(t => t.teamId !== winnerId);
    return loser?.teamId || null;
}

/**
 * Get display text for a team slot in a match (unified for both bracket types)
 */
export function getMatchTeamDisplay(match: BracketMatch, slotIndex: 0 | 1): string {
    const allMatches = getAllMatches();
    const seed = slotIndex === 0 ? match.team1Seed : match.team2Seed;

    if (seed !== null) {
        const team = getTeamAtSeed(seed);
        if (!team) return `Seed ${seed}`;
        return team.name;
    }

    const sourceRef = slotIndex === 0 ? match.sourceMatch1 : match.sourceMatch2;
    if (sourceRef) {
        // For double elimination, handle winner/loser progression
        const teamId = sourceRef.takesWinner
            ? getMatchWinner(sourceRef.matchIndex, sourceRef.bracket)
            : getMatchLoser(sourceRef.matchIndex, sourceRef.bracket);

        if (teamId) {
            return getTeamName(teamId);
        }

        // Lookahead for BYE
        const sourceMatch = allMatches.find((m) => m.matchIndex === sourceRef.matchIndex && m.bracket === sourceRef.bracket);
        if (sourceMatch) {
            if (sourceMatch.team1Seed !== null && sourceMatch.team2Seed === null && sourceMatch.sourceMatch2 === undefined) {
                return getTeamAtSeed(sourceMatch.team1Seed)?.name || `${sourceRef.takesWinner ? 'Winner' : 'Loser'}-${getMatchNameByIndex(sourceRef.matchIndex, sourceRef.bracket)}`;
            }
            if (sourceMatch.team1Seed === null && sourceMatch.team2Seed !== null && sourceMatch.sourceMatch1 === undefined) {
                return getTeamAtSeed(sourceMatch.team2Seed)?.name || `${sourceRef.takesWinner ? 'Winner' : 'Loser'}-${getMatchNameByIndex(sourceRef.matchIndex, sourceRef.bracket)}`;
            }
        }

        const prefix = sourceRef.takesWinner ? 'Winner' : 'Loser';
        return `${prefix}-${getMatchNameByIndex(sourceRef.matchIndex, sourceRef.bracket)}`;
    }

    return 'TBD';
}

/**
 * Check if a team slot is the winner (unified for both bracket types)
 */
export function isMatchWinner(match: BracketMatch, slotIndex: 0 | 1): boolean {
    const winnerId = getMatchWinner(match.matchIndex, match.bracket);
    if (!winnerId) return false;

    const seed = slotIndex === 0 ? match.team1Seed : match.team2Seed;
    if (seed !== null) {
        const team = getTeamAtSeed(seed);
        return team?.teamId === winnerId;
    }

    const sourceRef = slotIndex === 0 ? match.sourceMatch1 : match.sourceMatch2;
    const byeSeed = getByeSeedFromSource(sourceRef);
    if (byeSeed !== null) {
        const team = getTeamAtSeed(byeSeed);
        return team?.teamId === winnerId;
    }

    if (sourceRef) {
        const sourceTeamId = sourceRef.takesWinner
            ? getMatchWinner(sourceRef.matchIndex, sourceRef.bracket)
            : getMatchLoser(sourceRef.matchIndex, sourceRef.bracket);
        return sourceTeamId === winnerId;
    }

    return false;
}

/**
 * Check if a match needs tie resolution (unified for both bracket types)
 */
export function matchNeedsTieResolution(matchIndex: number, bracket: MatchBracket = "winners"): boolean {
    const tournament = tournamentStore.value;
    const game = getGame(matchIndex, bracket);
    if (!game) return false;
    const hasResult = tournament.bracketResults?.some((r: BracketResult) =>
        r.matchIndex === matchIndex && (r.bracket || "winners") === bracket
    );
    return game.isCompleted === true && !hasResult;
}

/**
 * Check if a match ended in a tie (unified for both bracket types)
 */
export function matchEndedInTie(matchIndex: number, bracket: MatchBracket = "winners"): boolean {
    const tournament = tournamentStore.value;
    const game = getGame(matchIndex, bracket);
    if (!game || game.isCompleted !== true) return false;
    const hasResult = tournament.bracketResults?.some((r: BracketResult) =>
        r.matchIndex === matchIndex && (r.bracket || "winners") === bracket
    );
    return !hasResult;
}

/**
 * Get teams participating in a match (unified for both bracket types)
 */
export function getTeamsForMatch(matchIndex: number, bracket: MatchBracket = "winners"): Array<{ teamId: string; name: string }> {
    const allMatches = getAllMatches();
    const match = allMatches.find((m) => m.matchIndex === matchIndex && m.bracket === bracket);
    if (!match) return [];

    const teamsInMatch: Array<{ teamId: string; name: string }> = [];

    // Get team 1
    if (match.team1Seed !== null) {
        const team = getTeamAtSeed(match.team1Seed);
        if (team) teamsInMatch.push({ teamId: team.teamId, name: team.name });
    } else if (match.sourceMatch1) {
        const byeSeed1 = getByeSeedFromSource(match.sourceMatch1);
        if (byeSeed1 !== null) {
            const team = getTeamAtSeed(byeSeed1);
            if (team) teamsInMatch.push({ teamId: team.teamId, name: team.name });
        } else {
            const teamId = match.sourceMatch1.takesWinner
                ? getMatchWinner(match.sourceMatch1.matchIndex, match.sourceMatch1.bracket)
                : getMatchLoser(match.sourceMatch1.matchIndex, match.sourceMatch1.bracket);
            if (teamId) {
                teamsInMatch.push({ teamId, name: getTeamName(teamId) });
            }
        }
    }

    // Get team 2
    if (match.team2Seed !== null) {
        const team = getTeamAtSeed(match.team2Seed);
        if (team) teamsInMatch.push({ teamId: team.teamId, name: team.name });
    } else if (match.sourceMatch2) {
        const byeSeed2 = getByeSeedFromSource(match.sourceMatch2);
        if (byeSeed2 !== null) {
            const team = getTeamAtSeed(byeSeed2);
            if (team) teamsInMatch.push({ teamId: team.teamId, name: team.name });
        } else {
            const teamId = match.sourceMatch2.takesWinner
                ? getMatchWinner(match.sourceMatch2.matchIndex, match.sourceMatch2.bracket)
                : getMatchLoser(match.sourceMatch2.matchIndex, match.sourceMatch2.bracket);
            if (teamId) {
                teamsInMatch.push({ teamId, name: getTeamName(teamId) });
            }
        }
    }

    return teamsInMatch;
}

/**
 * Build team slot data for BracketGame component (unified for both bracket types)
 */
export function buildTeamSlot(match: BracketMatch, slotIndex: 0 | 1, byeSeed: number | null = null): TeamSlot {
    const tournament = tournamentStore.value;
    const isOrganizer = tournamentStore.isOrganizer;

    const directSeed = slotIndex === 0 ? match.team1Seed : match.team2Seed;
    const seedToUse = directSeed ?? byeSeed;
    const isEditable = isOrganizer && !tournament.bracketConfirmed && seedToUse !== null;

    let display: string;
    if (byeSeed !== null && directSeed === null) {
        display = getTeamAtSeed(byeSeed)?.name ?? `Seed ${byeSeed}`;
    } else {
        display = getMatchTeamDisplay(match, slotIndex);
    }

    // Calculate the team ID for this slot to get the live score
    let teamIdForScore: string | null = null;
    if (seedToUse !== null) {
        teamIdForScore = getTeamAtSeed(seedToUse)?.teamId ?? null;
    } else {
        const sourceRef = slotIndex === 0 ? match.sourceMatch1 : match.sourceMatch2;
        if (sourceRef) {
            teamIdForScore = sourceRef.takesWinner
                ? getMatchWinner(sourceRef.matchIndex, sourceRef.bracket)
                : getMatchLoser(sourceRef.matchIndex, sourceRef.bracket);
        }
    }

    // Get live score if we have a team ID and a game for this match
    let score: number | null = null;
    if (teamIdForScore) {
        score = getTeamScoreForMatch(match.matchIndex, match.bracket, teamIdForScore);
    }

    return {
        display,
        isWinner: isMatchWinner(match, slotIndex),
        isEditable,
        seed: seedToUse,
        currentTeamId: seedToUse !== null ? (getTeamAtSeed(seedToUse)?.teamId ?? null) : null,
        score,
    };
}

// =============================================================================
// BACKWARD COMPATIBILITY ALIASES
// These functions delegate to the unified functions above
// =============================================================================

/** @deprecated Use isByeMatch instead */
export const isDoubleEliminationByeMatch = isByeMatch;

/** @deprecated Use getByeSeed instead */
export const getDoubleEliminationByeSeed = getByeSeed;

/** @deprecated Use getGame(matchIndex, bracket) instead */
export const getDoubleEliminationGame = getGame;

/** @deprecated Use isMatchLive(matchIndex, bracket) instead */
export const isDoubleEliminationMatchLive = isMatchLive;

/** @deprecated Use getTeamScoreForMatch(matchIndex, bracket, teamId) instead */
export const getDoubleEliminationTeamScore = getTeamScoreForMatch;

/** @deprecated Use getMatchWinner(matchIndex, bracket) instead */
export const getDoubleEliminationMatchWinner = getMatchWinner;

/** @deprecated Use getMatchLoser(matchIndex, bracket) instead */
export const getDoubleEliminationMatchLoser = getMatchLoser;

/** @deprecated Use getTeamsForMatch(matchIndex, bracket) instead */
export const getDoubleEliminationTeamsForMatch = getTeamsForMatch;

/**
 * Get the match name for a double elimination match by index and bracket
 */
export function getDoubleEliminationMatchNameByIndex(matchIndex: number, bracket: MatchBracket): string {
    const { winners, losers, grandFinal } = doubleEliminationStore.brackets;
    const numRounds = Math.ceil(Math.log2(_selectedBracketSize));

    if (bracket === "grand_final") {
        return matchIndex === 0 ? "Finals" : "Reset";
    }

    if (bracket === "winners") {
        const match = winners.find(m => m.matchIndex === matchIndex);
        if (!match) return `W${matchIndex + 1}`;

        const col = getWinnersColumnForRound(match.round, numRounds);
        const winnersRounds = [...new Set(winners.map(m => m.round))].sort((a, b) => a - b);

        if (match.round === winnersRounds[winnersRounds.length - 1]) {
            return `DE${col}-WF`;
        }

        const matchesInRound = winners.filter(m => m.round === match.round && !isByeMatch(m));
        const matchIdxInRound = matchesInRound.findIndex(m => m.matchIndex === matchIndex);
        const repeatCount = Math.floor(matchIdxInRound / 26) + 1;
        const charCode = 65 + (matchIdxInRound % 26);
        const letter = String.fromCharCode(charCode).repeat(repeatCount);
        return `DE${col}-W${letter}`;
    }

    if (bracket === "losers") {
        const match = losers.find(m => m.matchIndex === matchIndex);
        if (!match) return `L${matchIndex + 1}`;

        const col = getLosersColumnForRound(match.round);
        const losersRounds = [...new Set(losers.map(m => m.round))].sort((a, b) => a - b);

        if (match.round === losersRounds[losersRounds.length - 1]) {
            return `DE${col}-LF`;
        }

        const matchesInRound = losers.filter(m => m.round === match.round);
        const matchIdxInRound = matchesInRound.findIndex(m => m.matchIndex === matchIndex);
        const repeatCount = Math.floor(matchIdxInRound / 26) + 1;
        const charCode = 65 + (matchIdxInRound % 26);
        const letter = String.fromCharCode(charCode).repeat(repeatCount);
        return `DE${col}-L${letter}`;
    }

    return `Match ${matchIndex + 1}`;
}

/** @deprecated Use getMatchTeamDisplay instead */
export const getDoubleEliminationTeamDisplay = getMatchTeamDisplay;

/** @deprecated Use isMatchWinner instead */
export const isDoubleEliminationMatchWinnerSlot = isMatchWinner;

/** @deprecated Use matchNeedsTieResolution(matchIndex, bracket) instead */
export const doubleEliminationMatchNeedsTieResolution = matchNeedsTieResolution;

/** @deprecated Use matchEndedInTie(matchIndex, bracket) instead */
export const doubleEliminationMatchEndedInTie = matchEndedInTie;

/**
 * Get match name for double elimination
 * Uses grid column position for round number to match visual layout:
 * - DE1-WA, DE2-WA (winners in columns 1, 2)
 * - DE2-LA, DE3-LA (losers in columns 2, 3)
 * - DE4-WF (winners final)
 * - DE5-LF (losers final)
 * - Finals (grand final)
 */
export function getDoubleEliminationMatchName(match: BracketMatch, matchIdxInRound: number): string {
    const { winners, losers } = doubleEliminationStore.brackets;
    const numRounds = Math.ceil(Math.log2(_selectedBracketSize));

    if (match.bracket === "grand_final") {
        return match.matchIndex === 0 ? "Finals" : "Reset";
    }

    if (match.bracket === "winners") {
        // Get the grid column for this match
        const col = getWinnersColumnForRound(match.round, numRounds);

        // Check if this is the winners final
        const winnersRounds = [...new Set(winners.map(m => m.round))].sort((a, b) => a - b);
        if (match.round === winnersRounds[winnersRounds.length - 1]) {
            return `DE${col}-WF`;
        }

        const repeatCount = Math.floor(matchIdxInRound / 26) + 1;
        const charCode = 65 + (matchIdxInRound % 26);
        const letter = String.fromCharCode(charCode).repeat(repeatCount);
        return `DE${col}-W${letter}`;
    }

    if (match.bracket === "losers") {
        // Get the grid column for this match
        const col = getLosersColumnForRound(match.round);

        // Check if this is the losers final
        const losersRounds = [...new Set(losers.map(m => m.round))].sort((a, b) => a - b);
        if (match.round === losersRounds[losersRounds.length - 1]) {
            return `DE${col}-LF`;
        }

        const repeatCount = Math.floor(matchIdxInRound / 26) + 1;
        const charCode = 65 + (matchIdxInRound % 26);
        const letter = String.fromCharCode(charCode).repeat(repeatCount);
        return `DE${col}-L${letter}`;
    }

    return `Match ${match.matchIndex + 1}`;
}


/** @deprecated Use buildTeamSlot instead */
export const buildDoubleEliminationTeamSlot = buildTeamSlot;

/**
 * Get non-bye matches for a specific round in winners bracket
 */
export function getWinnersMatchesByRound(round: number): BracketMatch[] {
    return doubleEliminationStore.winners.filter(m => m.round === round && !isByeMatch(m));
}

/**
 * Get matches for a specific round in losers bracket
 */
export function getLosersMatchesByRound(round: number): BracketMatch[] {
    return doubleEliminationStore.losers.filter(m => m.round === round);
}

/**
 * Get display rounds for winners bracket (rounds with non-bye matches)
 */
export function getWinnersDisplayRounds(): number[] {
    const rounds = [...new Set(doubleEliminationStore.winners.map(m => m.round))].sort((a, b) => a - b);
    return rounds.filter(round => doubleEliminationStore.winners.some(m => m.round === round && !isDoubleEliminationByeMatch(m)));
}

/**
 * Get display rounds for losers bracket
 */
export function getLosersDisplayRounds(): number[] {
    return [...new Set(doubleEliminationStore.losers.map(m => m.round))].sort((a, b) => a - b);
}

/**
 * Check if GF Reset match is needed (only if losers bracket champion wins GF1)
 */
export function isGrandFinalResetNeeded(): boolean {
    const tournament = tournamentStore.value;
    if (!tournament.grandFinalReset) return false;

    const gf1Winner = getMatchWinner(0, "grand_final");
    if (!gf1Winner) return false;

    // Get the losers bracket champion (team that came from losers bracket in GF1)
    const grandFinal = doubleEliminationStore.grandFinal;
    const gf1Match = grandFinal.find(m => m.matchIndex === 0);
    if (!gf1Match) return false;

    // The second slot (sourceMatch2) is the losers bracket champion
    const losersBracketChamp = gf1Match.sourceMatch2
        ? getMatchWinner(gf1Match.sourceMatch2.matchIndex, gf1Match.sourceMatch2.bracket)
        : null;

    // Reset is needed if losers bracket champion won GF1
    return gf1Winner === losersBracketChamp;
}

// =============================================================================
// DOUBLE ELIMINATION GRID LAYOUT HELPERS
// =============================================================================

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
 *
 * For an 8-team bracket, the layout is:
 * - Round 1: W1 (4 matches)
 * - Round 2: W2 (2 matches), L1 (2 matches - losers from W1)
 * - Round 3: L2 (2 matches - L1 winners vs W2 losers)
 * - Round 4: WF (1 match), L3 (1 match - L2 consolidation)
 * - Round 5: LF (1 match - L3 winner vs WF loser)
 * - Finals: GF
 *
 * Total columns = losers rounds + 1 (for finals) + 1 (for reset if enabled)
 */
export function getDoubleEliminationGridDimensions(bracketSize: number): DEGridDimensions {
    const numRounds = Math.ceil(Math.log2(bracketSize));
    const fullBracketSize = Math.pow(2, numRounds);

    // Losers bracket has 2*(numRounds-1) rounds for brackets >= 4 teams
    // For 4 teams: L1, L2 (2 rounds)
    // For 8 teams: L1, L2, L3, L4 (4 rounds)
    // For 16 teams: L1, L2, L3, L4, L5, L6 (6 rounds)
    const losersRoundCount = Math.max(1, 2 * (numRounds - 1));

    // Total columns: 1 (W1) + losersRounds + 1 (Finals) + (1 if reset)
    // This gives us: Round 1, Round 2, ..., Round N, Finals
    const totalCols = 1 + losersRoundCount + 1 + (_selectedGrandFinalReset ? 1 : 0);

    // Rows: Winners portion + Losers portion
    // Winners: first round has fullBracketSize/2 matches, each needs 2 units for spacing
    const winnersFirstRoundMatches = fullBracketSize / 2;
    const winnersRows = winnersFirstRoundMatches * 2;

    // Losers: needs enough rows for the largest losers round
    // First losers round has fullBracketSize/4 matches
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
 * Map winners bracket round to grid column
 * Winners rounds are offset to align with losers bracket progression:
 * - W1 (round 0) → Column 1
 * - W2 (round 1) → Column 2
 * - WF (round 2 for 8-team) → Column 4 (skips column 3)
 *
 * Pattern: Winners round R maps to column 2*R + 1 for R > 0, column 1 for R = 0
 */
function getWinnersColumnForRound(winnersRound: number, numRounds: number): number {
    if (winnersRound === 0) return 1;
    // Each winners round after R0 maps to every other column
    // W1 → col 2, WF → col 4 (for 8-team)
    // W1 → col 2, W2 → col 4, WF → col 6 (for 16-team)
    return winnersRound * 2;
}

/**
 * Map losers bracket round to grid column
 * Losers rounds fill in sequentially starting from column 2:
 * - L1 (round 0) → Column 2
 * - L2 (round 1) → Column 3
 * - L3 (round 2) → Column 4
 * - LF (round 3) → Column 5
 */
function getLosersColumnForRound(losersRound: number): number {
    return losersRound + 2;
}

/**
 * Get grid position for a double elimination match
 */
export function getDoubleEliminationGridPosition(match: BracketMatch): DEGridPosition {
    const bracketSize = _selectedBracketSize;
    const numRounds = Math.ceil(Math.log2(bracketSize));
    const dims = getDoubleEliminationGridDimensions(bracketSize);

    const { winners, losers } = doubleEliminationStore.brackets;

    if (match.bracket === "winners") {
        // Winners bracket column based on round with gaps
        const col = getWinnersColumnForRound(match.round, numRounds);

        // Calculate row position based on match index within the round
        const matchesInRound = winners.filter(m => m.round === match.round && !isByeMatch(m));
        const matchIdxInRound = matchesInRound.findIndex(m => m.matchIndex === match.matchIndex);

        const totalMatchesInRound = matchesInRound.length;
        const rowSpan = Math.max(1, Math.floor(dims.winnersRows / totalMatchesInRound));
        const rowStart = matchIdxInRound * rowSpan + 1;

        return { col, rowStart, rowSpan };
    }

    if (match.bracket === "losers") {
        // Losers bracket: sequential columns starting from 2
        const col = getLosersColumnForRound(match.round);

        // Row position: starts after winners rows
        const matchesInRound = losers.filter(m => m.round === match.round);
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

        // Grand final spans start of wf location till end of lf location (bridging winners and losers)
        const rowStart = Math.max(1, Math.floor(dims.winnersRows / 2) + 1);
        const rowSpan = Math.max(2, Math.floor(dims.totalRows / 2));

        return { col, rowStart, rowSpan };
    }

    // Fallback
    return { col: 1, rowStart: 1, rowSpan: 1 };
}

/**
 * Get all double elimination matches as a flat array for grid rendering
 */
export function getAllDoubleEliminationMatchesForGrid(): BracketMatch[] {
    const tournament = tournamentStore.value;
    const { winners, losers, grandFinal } = doubleEliminationStore.brackets;

    // Filter out bye matches from winners
    const displayWinners = winners.filter(m => !isByeMatch(m));

    // Filter grand final reset if not needed
    const displayGrandFinal = grandFinal.filter((m, idx) => {
        if (idx === 0) return true; // Always show GF1
        // Show GF Reset only if bracket allows it and either not confirmed or reset is actually needed
        return _selectedGrandFinalReset && (isGrandFinalResetNeeded() || !tournament.bracketConfirmed);
    });

    return [...displayWinners, ...losers, ...displayGrandFinal];
}

/**
 * Get column header labels for the grid (Round 1, Round 2, ..., Finals)
 */
export function getDoubleEliminationColumnHeaders(): string[] {
    const bracketSize = _selectedBracketSize;
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
    if (_selectedGrandFinalReset) {
        headers.push('Finals-2');
    }

    return headers;
}
