/**
 * Type definitions for the tournament page and its components
 */

export interface TournamentSettings {
    spectatorsAllowed: boolean;
    times: {
        tossup: number[];
        bonus: number[];
        visual: number[];
    };
    pointValues: {
        tossup: number;
        bonus: number;
        penalty: number;
    };
    minPlayers: number;
    maxPlayers: number;
}

export interface BracketSeed {
    seed: number;
    teamId: string;
}

// Bracket type for single or double elimination
export type BracketType = "single" | "double";

// Match bracket for double elimination
export type MatchBracket = "winners" | "losers" | "grand_final";

export interface BracketResult {
    matchIndex: number;
    bracket?: MatchBracket; // For double elimination
    winningTeamId: string;
}

// Source match reference - used for all bracket types
export interface SourceMatch {
    matchIndex: number;
    bracket: MatchBracket;
    takesWinner: boolean; // true = takes winner, false = takes loser (for losers bracket)
}

// Unified match structure for all bracket types
// Single elimination uses bracket: "winners" for all matches
export interface BracketMatch {
    matchIndex: number;
    bracket: MatchBracket;
    round: number;
    team1Seed: number | null;
    team2Seed: number | null;
    sourceMatch1?: SourceMatch;
    sourceMatch2?: SourceMatch;
}

export interface Tournament {
    id: string;
    name: string;
    settings?: TournamentSettings;
    bracketSeeds?: BracketSeed[];
    bracketResults?: BracketResult[];
    bracketSize?: number;
    bracketConfirmed?: boolean;
    bracketType?: BracketType; // Single or double elimination
    grandFinalReset?: boolean; // For double elimination: whether bracket reset is enabled
    createdAt: number;
    gameIds?: string[];
}

export interface TournamentTeam {
    teamId: string;
    name: string;
    players: string[];
    registeredBy: string;
}

export interface TournamentGame {
    gameId: string;
    joinCode: string;
    moderatorJoinCode?: string;
    name: string;
    scores: Record<number, unknown>;
    teamNames?: Record<string, string>;
    playerNames?: Record<string, { name: string; teamId: string }>;
    pointValues: {
        tossup: number;
        bonus: number;
        penalty: number;
    };
    isActive?: boolean;
    isCompleted?: boolean;
    tournamentMatchIndex?: number;
    tournamentMatchBracket?: MatchBracket; // For double elimination
}
