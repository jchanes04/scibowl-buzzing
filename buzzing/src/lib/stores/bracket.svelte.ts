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
import type { BracketSeed, TournamentTeam, TournamentGame, BracketResult } from '../../routes/(app)/tournament/[id]/types';

// --- Bracket Match Types ---
export interface BracketMatch {
    matchIndex: number;
    round: number;
    team1Seed: number | null;
    team2Seed: number | null;
    sourceMatch1?: number;
    sourceMatch2?: number;
}

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

    // Reactively update bracket size from tournament or teams
    $effect(() => {
        const t = tournamentStore.value;
        const teams = tournamentTeamsStore.value;

        // If bracket is confirmed, always enforce the saved size
        if (t.bracketConfirmed && t.bracketSize) {
            if (_selectedBracketSize !== t.bracketSize) {
                _selectedBracketSize = t.bracketSize;
            }
        }
        // Initialize only when tournament data is loaded (id exists)
        else if (_selectedBracketSize === 0 && t.id) {
            if (t.bracketSize) {
                _selectedBracketSize = t.bracketSize;
            } else if (teams.length > 0) {
                _selectedBracketSize = teams.length;
            }
        }
    });
}

/**
 * Clear bracket store state
 */
export function clearBracketStore() {
    _selectedBracketSize = 0;
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
 */
export function getCurrentSeeds(): Array<{ seed: number; teamId: string }> {
    const tournament = tournamentStore.value;
    const seeds: Array<{ seed: number; teamId: string }> = [];
    const savedSeeds = tournament.bracketSeeds || [];

    // Start with saved seeds
    for (const s of savedSeeds) {
        if (!_pendingSeeds.has(s.teamId)) {
            seeds.push(s);
        }
    }

    // Apply pending changes
    for (const [teamId, seed] of _pendingSeeds) {
        if (seed !== null) {
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
 */
export async function saveBracketStructure(convex: any) {
    const tournament = tournamentStore.value;

    try {
        toastStore.add('Saving structure...', 'info', 1000);

        const seeds = getCurrentSeeds();

        await convex.mutation(api.tournaments.saveBracketStructure, {
            tournamentId: tournament.id,
            bracketSeeds: seeds,
            bracketSize: _selectedBracketSize,
        });

        _pendingSeeds = new Map();
        toastStore.add('Structure saved successfully!', 'success');
    } catch (error) {
        toastStore.add(`Error saving structure: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
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

    if (
        !confirm(
            `This will lock the bracket with ${_selectedBracketSize} teams and create all games. This cannot be undone. Continue?`
        )
    ) {
        return;
    }

    try {
        toastStore.add('Creating games...', 'info', 2000);

        // First save any pending changes
        if (_pendingSeeds.size > 0 || _selectedBracketSize !== tournament.bracketSize) {
            await saveBracketStructure(convex);
        }

        // Then confirm the structure
        const result = await convex.mutation(api.tournaments.confirmBracketStructure, {
            tournamentId: tournament.id,
        });

        toastStore.add(`Structure confirmed! Created ${result.matchCount} games.`, 'success');
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
 * Generate all bracket matches for a given bracket size
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
                round,
                team1Seed: null,
                team2Seed: null,
                sourceMatch1: previousRoundStart + i * 2,
                sourceMatch2: previousRoundStart + i * 2 + 1,
            });
            matchIndex++;
        }
        previousRoundStart += matchesInRound * 2;
        matchesInRound = Math.floor(matchesInRound / 2);
    }

    return matches;
}

// --- Bracket Matches Store ---

/**
 * Store for computed bracket match data
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
 * Get the bye seed from a source match index
 */
export function getByeSeedFromSource(sourceMatchIndex: number | undefined): number | null {
    if (sourceMatchIndex === undefined) return null;
    const matches = bracketMatchesStore.matches;
    const sourceMatch = matches.find((m) => m.matchIndex === sourceMatchIndex);
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

    const source1 = matches.find((m) => m.matchIndex === match.sourceMatch1);
    const source2 = matches.find((m) => m.matchIndex === match.sourceMatch2);

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
 * Get match name by match index (for "Winner of X" display)
 */
export function getMatchNameByIndex(matchIndex: number): string {
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
 * Get game for a match index
 */
export function getGame(matchIndex: number): TournamentGame | undefined {
    const games = tournamentGamesStore.value;
    return games.find((g: TournamentGame) => g.tournamentMatchIndex === matchIndex);
}

/**
 * Check if a match is currently live
 */
export function isMatchLive(matchIndex: number): boolean {
    const game = getGame(matchIndex);
    return !!(Object.keys(game?.teamNames ?? {}).length > 0
        && game?.isActive
        && !game?.isCompleted);
}

/**
 * Get team score for a specific match (only if team has joined)
 */
export function getTeamScoreForMatch(matchIndex: number, teamId: string): number | null {
    const game = getGame(matchIndex);
    if (!game || !game.scores || !game.pointValues) return null;
    if (!game.teamNames || !(teamId in game.teamNames)) return null;
    return calculateTeamScore(teamId, game.scores, game.pointValues);
}

/**
 * Get the winner of a match
 */
export function getMatchWinner(matchIndex: number): string | null {
    const tournament = tournamentStore.value;
    const matches = bracketMatchesStore.matches;

    const result = tournament.bracketResults?.find((r: BracketResult) => r.matchIndex === matchIndex);
    if (result) return result.winningTeamId;

    // Auto-advance byes
    const match = matches.find((m) => m.matchIndex === matchIndex);
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
 * Get display text for a team slot in a match
 */
export function getMatchTeamDisplay(match: BracketMatch, slotIndex: 0 | 1): string {
    const matches = bracketMatchesStore.matches;
    const seed = slotIndex === 0 ? match.team1Seed : match.team2Seed;

    if (seed !== null) {
        const team = getTeamAtSeed(seed);
        if (!team) return `Seed ${seed}`;
        return team.name;
    }

    const sourceMatchIndex = slotIndex === 0 ? match.sourceMatch1 : match.sourceMatch2;
    if (sourceMatchIndex !== undefined) {
        const winnerId = getMatchWinner(sourceMatchIndex);
        if (winnerId) {
            return getTeamName(winnerId);
        }

        // Lookahead for BYE
        const sourceMatch = matches.find((m) => m.matchIndex === sourceMatchIndex);
        if (sourceMatch) {
            if (sourceMatch.team1Seed !== null && sourceMatch.team2Seed === null && sourceMatch.sourceMatch2 === undefined) {
                return getTeamAtSeed(sourceMatch.team1Seed)?.name || `Winner-${getMatchNameByIndex(sourceMatchIndex)}`;
            }
            if (sourceMatch.team1Seed === null && sourceMatch.team2Seed !== null && sourceMatch.sourceMatch1 === undefined) {
                return getTeamAtSeed(sourceMatch.team2Seed)?.name || `Winner-${getMatchNameByIndex(sourceMatchIndex)}`;
            }
        }

        return `Winner-${getMatchNameByIndex(sourceMatchIndex)}`;
    }

    return 'BYE';
}

/**
 * Check if a team slot is the winner
 */
export function isMatchWinner(match: BracketMatch, slotIndex: 0 | 1): boolean {
    const winnerId = getMatchWinner(match.matchIndex);
    if (!winnerId) return false;

    const seed = slotIndex === 0 ? match.team1Seed : match.team2Seed;
    if (seed !== null) {
        const team = getTeamAtSeed(seed);
        return team?.teamId === winnerId;
    }

    const sourceMatchIndex = slotIndex === 0 ? match.sourceMatch1 : match.sourceMatch2;
    const byeSeed = getByeSeedFromSource(sourceMatchIndex);
    if (byeSeed !== null) {
        const team = getTeamAtSeed(byeSeed);
        return team?.teamId === winnerId;
    }

    if (sourceMatchIndex !== undefined) {
        const sourceWinnerId = getMatchWinner(sourceMatchIndex);
        return sourceWinnerId === winnerId;
    }

    return false;
}

/**
 * Check if a match needs tie resolution
 */
export function matchNeedsTieResolution(matchIndex: number): boolean {
    const tournament = tournamentStore.value;
    const game = getGame(matchIndex);
    if (!game) return false;
    const hasResult = tournament.bracketResults?.some((r: BracketResult) => r.matchIndex === matchIndex);
    return game.isCompleted === true && !hasResult;
}

/**
 * Check if a match ended in a tie
 */
export function matchEndedInTie(matchIndex: number): boolean {
    const tournament = tournamentStore.value;
    const game = getGame(matchIndex);
    if (!game || game.isCompleted !== true) return false;
    const hasResult = tournament.bracketResults?.some((r: BracketResult) => r.matchIndex === matchIndex);
    return !hasResult;
}

/**
 * Get teams participating in a match
 */
export function getTeamsForMatch(matchIndex: number): Array<{ teamId: string; name: string }> {
    const matches = bracketMatchesStore.matches;
    const match = matches.find((m) => m.matchIndex === matchIndex);
    if (!match) return [];

    const teamsInMatch: Array<{ teamId: string; name: string }> = [];

    // Get team 1
    if (match.team1Seed !== null) {
        const team = getTeamAtSeed(match.team1Seed);
        if (team) teamsInMatch.push({ teamId: team.teamId, name: team.name });
    } else {
        const byeSeed1 = getByeSeedFromSource(match.sourceMatch1);
        if (byeSeed1 !== null) {
            const team = getTeamAtSeed(byeSeed1);
            if (team) teamsInMatch.push({ teamId: team.teamId, name: team.name });
        } else if (match.sourceMatch1 !== undefined) {
            const winnerId = getMatchWinner(match.sourceMatch1);
            if (winnerId) {
                teamsInMatch.push({ teamId: winnerId, name: getTeamName(winnerId) });
            }
        }
    }

    // Get team 2
    if (match.team2Seed !== null) {
        const team = getTeamAtSeed(match.team2Seed);
        if (team) teamsInMatch.push({ teamId: team.teamId, name: team.name });
    } else {
        const byeSeed2 = getByeSeedFromSource(match.sourceMatch2);
        if (byeSeed2 !== null) {
            const team = getTeamAtSeed(byeSeed2);
            if (team) teamsInMatch.push({ teamId: team.teamId, name: team.name });
        } else if (match.sourceMatch2 !== undefined) {
            const winnerId = getMatchWinner(match.sourceMatch2);
            if (winnerId) {
                teamsInMatch.push({ teamId: winnerId, name: getTeamName(winnerId) });
            }
        }
    }

    return teamsInMatch;
}

/**
 * Build team slot data for BracketGame component
 */
export function buildTeamSlot(match: BracketMatch, slotIndex: 0 | 1, byeSeed: number | null): TeamSlot {
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
        const sourceMatchIndex = slotIndex === 0 ? match.sourceMatch1 : match.sourceMatch2;
        if (sourceMatchIndex !== undefined) {
            teamIdForScore = getMatchWinner(sourceMatchIndex);
        }
    }

    // Get live score if we have a team ID and a game for this match
    let score: number | null = null;
    if (teamIdForScore) {
        score = getTeamScoreForMatch(match.matchIndex, teamIdForScore);
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
