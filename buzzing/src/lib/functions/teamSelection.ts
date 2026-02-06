/**
 * Shared team selection functions for consistent team handling
 * across the join page and bracket view/store.
 *
 * These functions ensure that team IDs are handled consistently
 * using `teamId` as the primary identifier throughout the app.
 */

/**
 * Team option for dropdown/select components
 */
export interface TeamOption {
    value: string; // teamId
    label: string; // team name
}


/**
 * Transform teams to dropdown options for seed selection and other selects
 * @param teams - Array of teams with teamId and name
 * @returns Array of TeamOption objects
 */
export function getTeamOptions<T extends { teamId: string; name: string }>(
    teams: T[]
): TeamOption[] {
    return teams.map((t) => ({
        value: t.teamId,
        label: t.name,
    }));
}


/**
 * Find a team by its teamId
 * @param teams - Array of teams
 * @param teamId - The teamId to find
 * @returns The team or undefined
 */
export function findTeamById<T extends { teamId: string }>(
    teams: T[],
    teamId: string
): T | undefined {
    return teams.find((t) => t.teamId === teamId);
}

/**
 * Get team name by teamId
 * @param teams - Array of teams
 * @param teamId - The teamId to look up
 * @returns Team name or 'Unknown Team'
 */
export function getTeamNameById<T extends { teamId: string; name: string }>(
    teams: T[],
    teamId: string
): string {
    const team = findTeamById(teams, teamId);
    return team ? team.name : "Unknown Team";
}

// Import bracket types for team resolution
import type {
    BracketMatch,
    MatchBracket,
    GeneratedBracket,
    SourceMatch,
} from "./bracketGeneration";

/**
 * Bracket result from tournament (winner of a match)
 */
export interface BracketResult {
    matchIndex: number;
    bracket?: MatchBracket;
    winningTeamId: string;
}

/**
 * Bracket seed assignment
 */
export interface BracketSeed {
    seed: number;
    teamId: string;
}

/**
 * Configuration for resolving match teams
 */
export interface MatchTeamResolverConfig<T extends { teamId: string; name: string }> {
    bracket: GeneratedBracket;
    bracketSeeds: BracketSeed[];
    results: BracketResult[];
    teams: T[];
}

/**
 * Get team from a seed number
 */
function getTeamFromSeed<T extends { teamId: string; name: string }>(
    seed: number | null,
    bracketSeeds: BracketSeed[],
    teams: T[]
): T | undefined {
    if (seed === null || seed === 0) return undefined;
    const seedData = bracketSeeds.find((s) => s.seed === seed);
    if (!seedData) return undefined;
    return teams.find((t) => t.teamId === seedData.teamId);
}

/**
 * Find a match in the generated bracket
 */
function findMatch(
    bracket: GeneratedBracket,
    matchIndex: number,
    matchBracket: MatchBracket
): BracketMatch | undefined {
    switch (matchBracket) {
        case "winners":
            return bracket.winners.find((m) => m.matchIndex === matchIndex);
        case "losers":
            return bracket.losers.find((m) => m.matchIndex === matchIndex);
        case "grand_final":
            return bracket.grandFinal.find((m) => m.matchIndex === matchIndex);
        case "roundrobin":
            return bracket.roundrobin.find((m) => m.matchIndex === matchIndex);
        default:
            return undefined;
    }
}

/**
 * Get winner of a match from bracket results or bye detection
 */
function getMatchWinner<T extends { teamId: string; name: string }>(
    matchIndex: number,
    matchBracket: MatchBracket,
    config: MatchTeamResolverConfig<T>
): T | undefined {
    const { bracket, bracketSeeds, results, teams } = config;

    // Check stored results first
    const result = results.find(
        (r) => r.matchIndex === matchIndex && (r.bracket || "winners") === matchBracket
    );
    if (result) {
        return teams.find((t) => t.teamId === result.winningTeamId);
    }

    // Check for bye (one team with seed, other is null with no source)
    const match = findMatch(bracket, matchIndex, matchBracket);
    if (match) {
        if (match.team1Seed !== null && match.team2Seed === null && !match.sourceMatch2) {
            return getTeamFromSeed(match.team1Seed, bracketSeeds, teams);
        }
        if (match.team2Seed !== null && match.team1Seed === null && !match.sourceMatch1) {
            return getTeamFromSeed(match.team2Seed, bracketSeeds, teams);
        }
    }

    return undefined;
}

/**
 * Get loser of a match (for double elimination losers bracket)
 */
function getMatchLoser<T extends { teamId: string; name: string }>(
    matchIndex: number,
    matchBracket: MatchBracket,
    config: MatchTeamResolverConfig<T>
): T | undefined {
    const winner = getMatchWinner(matchIndex, matchBracket, config);
    if (!winner) return undefined;

    // Get both teams in the match
    const matchTeams = resolveMatchTeamsInternal(matchIndex, matchBracket, config);
    return matchTeams.find((t) => t.teamId !== winner.teamId);
}

/**
 * Get team from a source match reference
 */
function getTeamFromSource<T extends { teamId: string; name: string }>(
    source: SourceMatch | undefined,
    config: MatchTeamResolverConfig<T>
): T | undefined {
    if (!source) return undefined;

    if (source.takesWinner) {
        return getMatchWinner(source.matchIndex, source.bracket, config);
    } else {
        return getMatchLoser(source.matchIndex, source.bracket, config);
    }
}

/**
 * Internal resolver (used recursively for source match lookups)
 */
function resolveMatchTeamsInternal<T extends { teamId: string; name: string }>(
    matchIndex: number,
    matchBracket: MatchBracket,
    config: MatchTeamResolverConfig<T>
): T[] {
    const { bracket, bracketSeeds, teams } = config;
    const result: T[] = [];

    const match = findMatch(bracket, matchIndex, matchBracket);
    if (!match) return result;

    // Get team 1
    if (match.team1Seed !== null) {
        const team = getTeamFromSeed(match.team1Seed, bracketSeeds, teams);
        if (team) result.push(team);
    } else if (match.sourceMatch1) {
        const team = getTeamFromSource(match.sourceMatch1, config);
        if (team) result.push(team);
    }

    // Get team 2
    if (match.team2Seed !== null) {
        const team = getTeamFromSeed(match.team2Seed, bracketSeeds, teams);
        if (team) result.push(team);
    } else if (match.sourceMatch2) {
        const team = getTeamFromSource(match.sourceMatch2, config);
        if (team) result.push(team);
    }

    return result;
}

/**
 * Resolve which teams are in a specific tournament match.
 * This is the main shared function used by both the join page and bracket view
 * to ensure consistent team resolution across the app.
 *
 * Handles:
 * - Direct seeds (first round matches, round robin)
 * - Source match resolution (later rounds in elimination brackets)
 * - Bye detection (auto-advances)
 * - Winner/loser tracking for double elimination
 *
 * @param matchIndex - The match index within the bracket
 * @param matchBracket - Which bracket the match belongs to
 * @param config - Configuration with bracket structure, seeds, results, and teams
 * @returns Array of teams that should be in the match
 */
export function resolveMatchTeams<T extends { teamId: string; name: string }>(
    matchIndex: number,
    matchBracket: MatchBracket,
    config: MatchTeamResolverConfig<T>
): T[] {
    return resolveMatchTeamsInternal(matchIndex, matchBracket, config);
}
