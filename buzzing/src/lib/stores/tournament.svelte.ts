/**
 * Tournament context store with Convex subscriptions
 *
 * Provides centralized access to tournament data, teams, games, and organizer status.
 * All data comes from Convex subscriptions - stores are read-only.
 */
import { useQuery, useConvexClient } from 'convex-svelte';
import { api } from '../../../convex/_generated/api';
import type {
    Tournament,
    TournamentTeam,
    TournamentGame,
} from '../../routes/(app)/tournament/[id]/types';

let subscriptionTournamentId = $state<string | null>(null);
let _isOrganizer = $state(false);

let _tournament = $state<Tournament | null>(null);
let _teams = $state<TournamentTeam[]>([]);
let _games = $state<TournamentGame[]>([]);

/**
 * Initialize tournament subscriptions
 */
export function initTournamentSubscription(
    tournamentId: string,
    isOrganizer: boolean,
    initialTournament?: Tournament
) {
    subscriptionTournamentId = tournamentId;
    _isOrganizer = isOrganizer;
    _tournament = initialTournament ?? null;

    // Create subscriptions
    const tournamentQuery = useQuery(api.tournaments.getById, () =>
        subscriptionTournamentId ? { tournamentId: subscriptionTournamentId } : 'skip'
    );

    const teamsQuery = useQuery(api.tournaments.getTeams, () =>
        subscriptionTournamentId ? { tournamentId: subscriptionTournamentId } : 'skip'
    );

    const gamesQuery = useQuery(api.games.getByTournamentId, () =>
        subscriptionTournamentId ? { tournamentId: subscriptionTournamentId } : 'skip'
    );

    // Sync query results to state
    $effect(() => {
        if (tournamentQuery.data) {
            _tournament = {
                id: tournamentQuery.data.tournamentId,
                name: tournamentQuery.data.name,
                settings: tournamentQuery.data.settings,
                bracketSeeds: tournamentQuery.data.bracketSeeds || [],
                bracketResults: tournamentQuery.data.bracketResults || [],
                bracketSize: tournamentQuery.data.bracketSize,
                bracketConfirmed: tournamentQuery.data.bracketConfirmed,
                createdAt: tournamentQuery.data.createdAt,
                gameIds: tournamentQuery.data.gameIds || [],
            };
        }
    });

    $effect(() => {
        if (teamsQuery.data) {
            _teams = teamsQuery.data;
        }
    });

    $effect(() => {
        if (gamesQuery.data) {
            _games = gamesQuery.data
                .filter((game): game is NonNullable<typeof game> => game !== null)
                .map((game) => ({
                    gameId: game.gameId,
                    joinCode: game.joinCode,
                    moderatorJoinCode: game.moderatorJoinCode,
                    name: game.name,
                    scores: game.scores as Record<number, unknown>,
                    teamNames: game.teamNames as Record<string, string> | undefined,
                    playerNames: game.playerNames as Record<string, { name: string; teamId: string }> | undefined,
                    pointValues: game.pointValues,
                    isActive: game.isActive,
                    isCompleted: game.isCompleted,
                    tournamentMatchIndex: game.tournamentMatchIndex,
                }));
        }
    });
}

/**
 * Clear tournament subscriptions
 */
export function clearTournamentSubscription() {
    subscriptionTournamentId = null;
    _isOrganizer = false;
    _tournament = null;
    _teams = [];
    _games = [];
}

/**
 * Tournament store - provides live tournament data with fallback
 */
export const tournamentStore = {
    get value(): Tournament {
        return _tournament ?? {
            id: '',
            name: '',
            createdAt: 0,
        };
    },
    get isOrganizer(): boolean {
        return _isOrganizer;
    },
};

/**
 * Teams store - provides live teams data with fallback
 */
export const tournamentTeamsStore = {
    get value(): TournamentTeam[] {
        return _teams;
    },
};

/**
 * Games store - provides live games data with fallback
 */
export const tournamentGamesStore = {
    get value(): TournamentGame[] {
        return _games;
    },
};

/**
 * Get Convex client for mutations
 */
export function getTournamentConvexClient() {
    return useConvexClient();
}

export default {
    tournamentStore,
    tournamentTeamsStore,
    tournamentGamesStore,
    initTournamentSubscription,
    clearTournamentSubscription,
    getTournamentConvexClient,
};
