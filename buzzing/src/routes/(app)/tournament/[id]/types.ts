/**
 * Type definitions for the tournament page and its components
 *
 * Core bracket types (BracketMatch, SourceMatch, MatchBracket, BracketType)
 * are re-exported from the shared bracketGeneration module.
 */

// Import and re-export shared bracket types from the unified module
import type {
    BracketMatch as _BracketMatch,
    SourceMatch as _SourceMatch,
    MatchBracket as _MatchBracket,
    BracketType as _BracketType,
    GeneratedBracket as _GeneratedBracket,
    BracketGenerationOptions as _BracketGenerationOptions,
    DEGridDimensions as _DEGridDimensions,
    DEGridPosition as _DEGridPosition,
} from '$lib/functions/bracketGeneration';

// Re-export with public names
export type BracketMatch = _BracketMatch;
export type SourceMatch = _SourceMatch;
export type MatchBracket = _MatchBracket;
export type BracketType = _BracketType;
export type GeneratedBracket = _GeneratedBracket;
export type BracketGenerationOptions = _BracketGenerationOptions;
export type DEGridDimensions = _DEGridDimensions;
export type DEGridPosition = _DEGridPosition;

// Re-export shared types
import type { BracketSeed, BracketResult } from '$lib/functions/teamSelection';
import type { PointValues } from '$lib/functions/scoreboard';
import type { Member, Team } from '$lib/types/members';
import type { QuestionPairScore } from '$lib/stores/scoreboard.svelte';
export type { BracketSeed, BracketResult, PointValues };

export interface TournamentSettings {
    spectatorsAllowed: boolean;
    times: {
        tossup: number[];
        bonus: number[];
        visual: number[];
    };
    pointValues: PointValues;
    minPlayers: number;
    maxPlayers: number;
}

export interface Tournament {
    id: string;
    name: string;
    settings?: TournamentSettings;
    bracketSeeds?: BracketSeed[];
    bracket?: {
        gameIds: string[];
        results: BracketResult[];
    };
    bracketSize?: number;
    bracketConfirmed?: boolean;
    bracketType?: BracketType; // Single or double elimination
    winnerTakesAll?: boolean; // For double elimination: whether bracket reset is enabled
    createdAt: number;
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
    scores: Record<string, QuestionPairScore>;
    members?: Record<string, Member>;
    teams?: Record<string, Team>;
    pointValues: PointValues;
    isActive?: boolean;
    isCompleted?: boolean;
    tournamentMatchIndex?: number;
    tournamentMatchBracket?: MatchBracket; // For double elimination
}
