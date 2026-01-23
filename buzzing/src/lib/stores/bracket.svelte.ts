/**
 * Bracket state store for tournament bracket management
 *
 * Handles pending seed assignments, bracket size selection, bracket operations,
 * and bracket match generation/display logic.
 * Works in conjunction with tournament.svelte.ts for full tournament context.
 *
 * Uses the unified bracket generation module from $lib/functions/bracketGeneration
 */
import { api } from '../../../convex/_generated/api';
import { tournamentStore, tournamentTeamsStore, tournamentGamesStore } from './tournament.svelte';
import { calculateTeamScore } from '$lib/functions/scoreboard';
import { toastStore } from './toast.svelte';
import type { BracketSeed, TournamentTeam, TournamentGame, BracketResult, BracketType } from '../../routes/(app)/tournament/[id]/types';

// Import from unified bracket generation module
import {
    generateBracket,
    isByeMatch,
    getByeSeed,
    getAllMatches as getAllMatchesFn,
    getDisplayRounds as getDisplayRoundsFn,
    getSingleEliminationMatchName,
    getSingleEliminationRoundTitle,
    getDoubleEliminationMatchName as getDEMatchName,
    getDoubleEliminationGridDimensions as getDEGridDimensions,
    getDoubleEliminationGridPosition as getDEGridPosition,
    getDoubleEliminationColumnHeaders as getDEColumnHeaders,
    type BracketMatch,
    type MatchBracket,
    type SourceMatch,
    type GeneratedBracket,
    type DEGridDimensions,
    type DEGridPosition,
} from '$lib/functions/bracketGeneration';

// Re-export types for consumers
export type { BracketMatch, MatchBracket, SourceMatch, GeneratedBracket, DEGridDimensions, DEGridPosition };

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
 * Winner takes all finals store (for double elimination)
 * When false, a bracket reset match is played if losers bracket champion wins first Grand Final
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
    const resetInfo = _selectedBracketType === "double" ? (_selectedGrandFinalReset ? "" : " (winner takes all finals)") : "";

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
// Uses unified generateBracket from $lib/functions/bracketGeneration

/**
 * Get generated bracket for current settings
 */
function getCurrentBracket(): GeneratedBracket {
    return generateBracket({
        bracketSize: _selectedBracketSize,
        bracketType: _selectedBracketType,
        grandFinalReset: _selectedGrandFinalReset,
    });
}

// --- Bracket Matches Store ---

/**
 * Unified bracket store that works for both SE and DE
 * For SE: winners bracket only, losers and grandFinal are empty
 * For DE: all three sections populated
 */
export const bracketStore = {
    get bracket(): GeneratedBracket {
        return getCurrentBracket();
    },
    get winners(): BracketMatch[] {
        return this.bracket.winners;
    },
    get losers(): BracketMatch[] {
        return this.bracket.losers;
    },
    get grandFinal(): BracketMatch[] {
        return this.bracket.grandFinal;
    },
    get allMatches(): BracketMatch[] {
        return getAllMatchesFn(this.bracket);
    },
    get winnersNumRounds(): number {
        const matches = this.winners;
        return matches.length > 0 ? (matches[matches.length - 1]?.round ?? -1) + 1 : 0;
    },
    get losersNumRounds(): number {
        const matches = this.losers;
        return matches.length > 0 ? (matches[matches.length - 1]?.round ?? -1) + 1 : 0;
    },
    get firstRoundMatchCount(): number {
        return this.winnersNumRounds > 0 ? Math.pow(2, this.winnersNumRounds - 1) : 0;
    },
    get totalGridRows(): number {
        return this.firstRoundMatchCount;
    },
};

// --- Match Helper Functions ---
// Re-exported from $lib/functions/bracketGeneration for convenience
export { isByeMatch, getByeSeed } from '$lib/functions/bracketGeneration';

/**
 * Get the bye seed from a source match reference
 */
export function getByeSeedFromSource(source: SourceMatch | undefined): number | null {
    if (source === undefined) return null;
    const allMatches = bracketStore.allMatches;
    const sourceMatch = allMatches.find((m) => m.matchIndex === source.matchIndex && m.bracket === source.bracket);
    return sourceMatch ? getByeSeed(sourceMatch) : null;
}

/**
 * Get non-bye matches for a specific round (winners bracket for SE, specified bracket for DE)
 */
export function getMatchesByRound(round: number, bracket: MatchBracket = "winners"): BracketMatch[] {
    let matches: BracketMatch[];
    switch (bracket) {
        case "winners":
            matches = bracketStore.winners;
            break;
        case "losers":
            matches = bracketStore.losers;
            break;
        case "grand_final":
            matches = bracketStore.grandFinal;
            break;
        default:
            matches = bracketStore.winners;
    }
    return matches.filter((m) => m.round === round && !isByeMatch(m));
}

/**
 * Get rounds that have non-bye matches (for display)
 */
export function getDisplayRounds(bracket: MatchBracket = "winners"): number[] {
    let matches: BracketMatch[];
    switch (bracket) {
        case "winners":
            matches = bracketStore.winners;
            break;
        case "losers":
            matches = bracketStore.losers;
            break;
        case "grand_final":
            matches = bracketStore.grandFinal;
            break;
        default:
            matches = bracketStore.winners;
    }
    return getDisplayRoundsFn(matches);
}

/**
 * Get the pair index for a first-round match
 */
function getFirstRoundPairIndex(match: BracketMatch): number {
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
 * Get grid position for a match based on bracket structure (single elimination)
 */
export function getMatchGridPosition(match: BracketMatch): { start: number; end: number } {
    const matches = bracketStore.winners;

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
// Uses unified naming functions from bracketGeneration

/**
 * Get match name for any bracket type
 */
export function getMatchName(match: BracketMatch, displayRoundIdx: number, matchIdxInRound: number): string {
    if (_selectedBracketType === "double") {
        return getDEMatchName(match, matchIdxInRound, bracketStore.bracket, _selectedBracketSize);
    }
    const displayRoundsArr = getDisplayRounds("winners");
    return getSingleEliminationMatchName(match, displayRoundIdx, matchIdxInRound, displayRoundsArr.length);
}

/**
 * Get match name by match index and bracket (for "Winner of X" display)
 * Uses appropriate naming based on bracket type
 */
export function getMatchNameByIndex(matchIndex: number, bracket: MatchBracket = "winners"): string {
    const allMatches = bracketStore.allMatches;
    const match = allMatches.find((m) => m.matchIndex === matchIndex && m.bracket === bracket);
    if (!match) return `Match ${matchIndex + 1}`;

    if (_selectedBracketType === "double") {
        const matchesInRound = getMatchesByRound(match.round, bracket);
        const matchIdxInRound = matchesInRound.findIndex((m) => m.matchIndex === matchIndex);
        return getDEMatchName(match, matchIdxInRound, bracketStore.bracket, _selectedBracketSize);
    }

    // Single elimination naming
    const displayRoundsArr = getDisplayRounds("winners");
    const displayRoundIdx = displayRoundsArr.indexOf(match.round);
    if (displayRoundIdx === -1) {
        return `Match ${matchIndex + 1}`;
    }

    const matchesInRound = getMatchesByRound(match.round, "winners");
    const matchIdxInRound = matchesInRound.findIndex((m) => m.matchIndex === matchIndex);

    return getSingleEliminationMatchName(match, displayRoundIdx, matchIdxInRound, displayRoundsArr.length);
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
    const allMatches = bracketStore.allMatches;

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
    const allMatches = bracketStore.allMatches;
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
    const allMatches = bracketStore.allMatches;
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

/**
 * Check if GF Reset match is needed (only if losers bracket champion wins GF1)
 */
function isGrandFinalResetNeeded(): boolean {
    const tournament = tournamentStore.value;
    if (!tournament.grandFinalReset) return false;

    const gf1Winner = getMatchWinner(0, "grand_final");
    if (!gf1Winner) return false;

    // Get the losers bracket champion (team that came from losers bracket in GF1)
    const grandFinal = bracketStore.grandFinal;
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
// Uses unified functions from $lib/functions/bracketGeneration

/**
 * Calculate grid dimensions for double elimination bracket
 */
export function getDoubleEliminationGridDimensions(bracketSize: number = _selectedBracketSize): DEGridDimensions {
    return getDEGridDimensions(bracketSize, _selectedGrandFinalReset);
}

/**
 * Get grid position for a double elimination match
 */
export function getDoubleEliminationGridPosition(match: BracketMatch): DEGridPosition {
    return getDEGridPosition(match, bracketStore.bracket, _selectedBracketSize, _selectedGrandFinalReset);
}

/**
 * Get all matches for grid rendering (works for both SE and DE)
 */
export function getAllMatchesForGrid(): BracketMatch[] {
    const tournament = tournamentStore.value;
    const bracket = bracketStore.bracket;

    // Filter out bye matches from winners
    const displayWinners = bracket.winners.filter(m => !isByeMatch(m));

    if (_selectedBracketType === "single") {
        return displayWinners;
    }

    // For DE, include losers and grand final
    const displayGrandFinal = bracket.grandFinal.filter((m, idx) => {
        if (idx === 0) return true; // Always show GF1
        // Show GF Reset only if bracket allows it and either not confirmed or reset is actually needed
        return _selectedGrandFinalReset && (isGrandFinalResetNeeded() || !tournament.bracketConfirmed);
    });

    return [...displayWinners, ...bracket.losers, ...displayGrandFinal];
}

/**
 * Get column header labels for the grid
 */
export function getColumnHeaders(): string[] {
    if (_selectedBracketType === "single") {
        const displayRoundsArr = getDisplayRounds("winners");
        return displayRoundsArr.map((_, idx) => getSingleEliminationRoundTitle(idx, displayRoundsArr.length));
    }
    return getDEColumnHeaders(_selectedBracketSize, _selectedGrandFinalReset);
}
