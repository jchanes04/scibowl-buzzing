/**
 * Unified members store with Convex subscriptions
 *
 * This replaces the separate players.svelte.ts, moderators.svelte.ts,
 * teams.svelte.ts, and myMember.svelte.ts stores.
 *
 * All data comes from Convex subscriptions - stores are read-only.
 */
import { useQuery } from 'convex-svelte';
import { api } from '../../../convex/_generated/api';

// Subscription parameters
let subscriptionGameId = $state<string | null>(null);
let myMemberId = $state<string | null>(null);

// Internal state populated from Convex queries
let _members = $state<Array<{ id: string; name: string; type: "player" | "moderator"; teamId?: string; isActive: boolean }>>([]);
let _teams = $state<Array<{ teamId: string; name: string; type: "default" | "created" | "individual"; captainId?: string }>>([]);

// Track if subscription is already initialized
let isInitialized = $state(false);

/**
 * Initialize subscriptions for members and teams
 */
export function initMembersSubscription(gameId: string, memberId: string) {
    // Only initialize once
    if (isInitialized) return;

    subscriptionGameId = gameId;
    myMemberId = memberId;
    isInitialized = true;

    // These create single subscriptions shared via the internal state
    const membersQuery = useQuery(api.gameMembers.getForGame, () =>
        subscriptionGameId ? { gameId: subscriptionGameId } : 'skip'
    );

    const teamsQuery = useQuery(api.teams.getForGame, () =>
        subscriptionGameId ? { gameId: subscriptionGameId } : 'skip'
    );

    // Sync query results to state automatically
    $effect(() => {
        if (membersQuery.data) _members = membersQuery.data;
        if (teamsQuery.data) _teams = teamsQuery.data;
    });
}

/**
 * Clear subscriptions
 */
export function clearMembersSubscription() {
    subscriptionGameId = null;
    myMemberId = null;
    _members = [];
    _teams = [];
    isInitialized = false;
}

// Types for the derived stores
export type ClientTeamData = {
    id: string;
    name: string;
    type: "default" | "created" | "individual";
    captainId: string | null;
    players: Record<string, { id: string; name: string; type: "player" }>;
};

export type ClientPlayer = {
    id: string;
    name: string;
    type: "player";
    team: ClientTeamData;
    isActive: boolean;
};

export type ClientModerator = {
    id: string;
    name: string;
    type: "moderator";
    isActive: boolean;
};

export type MyMember = {
    id: string;
    name: string;
    moderator: boolean;
    team?: ClientTeamData;
};

/**
 * Teams store - derived from Convex data
 */
export const teamsStore = {
    get value(): Record<string, ClientTeamData> {
        const teamMap: Record<string, ClientTeamData> = {};

        // First pass: create team objects
        for (const t of _teams) {
            teamMap[t.teamId] = {
                id: t.teamId,
                name: t.name,
                type: t.type,
                captainId: t.captainId ?? null,
                players: {}
            };
        }

        // Second pass: add players to their teams
        for (const m of _members) {
            if (m.type === "player" && m.teamId) {
                const team = teamMap[m.teamId];
                if (team) {
                    team.players[m.id] = {
                        id: m.id,
                        name: m.name,
                        type: "player",
                        isActive: m.isActive
                    };
                }
            }
        }

        return teamMap;
    }
};

/**
 * Players store - derived from Convex data
 */
export const playersStore = {
    get value(): Record<string, ClientPlayer> {
        const teams = teamsStore.value;
        const players: Record<string, ClientPlayer> = {};

        for (const m of _members) {
            if (m.type === "player" && m.teamId) {
                const team = teams[m.teamId];
                if (team) {
                    players[m.id] = {
                        id: m.id,
                        name: m.name,
                        type: "player",
                        team,
                        isActive: m.isActive
                    };
                }
            }
        }

        return players;
    }
};

/**
 * Moderators store - derived from Convex data
 */
export const moderatorsStore = {
    get value(): Record<string, ClientModerator> {
        const moderators: Record<string, ClientModerator> = {};

        for (const m of _members) {
            if (m.type === "moderator") {
                moderators[m.id] = {
                    id: m.id,
                    name: m.name,
                    type: "moderator",
                    isActive: m.isActive
                };
            }
        }

        return moderators;
    }
};

/**
 * My member store - derived from members data and myMemberId
 * Automatically updates when member data changes (e.g., on promotion)
 */
export const myMemberStore = {
    get value(): MyMember {
        if (!myMemberId) {
            return { id: "", name: "", moderator: false };
        }

        const players = playersStore.value;
        const moderators = moderatorsStore.value;

        const player = players[myMemberId];
        if (player) {
            return {
                id: player.id,
                name: player.name,
                moderator: false,
                team: player.team
            };
        }

        const moderator = moderators[myMemberId];
        if (moderator) {
            return {
                id: moderator.id,
                name: moderator.name,
                moderator: true
            };
        }

        // Fallback - member not found yet (might be loading)
        return { id: myMemberId, name: "", moderator: false };
    }
};

// Re-export simplified interface
export default {
    teamsStore,
    playersStore,
    moderatorsStore,
    myMemberStore,
    initMembersSubscription,
    clearMembersSubscription
};
