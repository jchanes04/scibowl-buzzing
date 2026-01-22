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

export interface BracketResult {
    matchIndex: number;
    winningTeamId: string;
}

export interface Tournament {
    id: string;
    name: string;
    settings?: TournamentSettings;
    bracketSeeds?: BracketSeed[];
    bracketResults?: BracketResult[];
    bracketSize?: number;
    bracketConfirmed?: boolean;
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
}
