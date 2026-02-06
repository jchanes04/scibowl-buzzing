/**
 * Unified members store with socket-based state
 *
 * This replaces the separate players.svelte.ts, moderators.svelte.ts,
 * teams.svelte.ts, and myMember.svelte.ts stores.
 *
 * All data comes from socket 'membersUpdate' events - stores are read-only.
 */
import type { Member, Team } from '$lib/types/members';

// Subscription parameters
let myMemberId = $state<string | null>(null);

// Internal state populated from socket updates
let _members = $state<Record<string, Member>>({});
let _teams = $state<Record<string, Team>>({});

// Track if subscription is already initialized
let isInitialized = $state(false);

/**
 * Update members/teams from socket 'membersUpdate' event
 */
export function updateMembersFromSocket(data: { members: Record<string, Member>, teams: Record<string, Team> }) {
    _members = data.members;
    _teams = data.teams;
}

/**
 * Initialize members store with member ID (no Convex subscriptions needed)
 */
export function initMembersSubscription(gameId: string, memberId: string) {
    if (isInitialized) return;

    myMemberId = memberId;
    isInitialized = true;
}

/**
 * Clear state
 */
export function clearMembersSubscription() {
    myMemberId = null;
    _members = {};
    _teams = {};
    isInitialized = false;
}

// Types for the derived stores
export type ClientTeamData = {
    id: string;
    name: string;
    type: "default" | "created" | "individual" | "tournament";
    captainId: string | null;
    players: Record<string, Omit<ClientPlayer, "team">>;
};

export type ClientPlayer = {
    id: string;
    name: string;
    type: "player";
    team: ClientTeamData;
    isActive: boolean;
    isSubbed: boolean;
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
    isSubbed?: boolean;
};

/**
 * Teams store - derived from socket data
 */
export const teamsStore = {
    get value(): Record<string, ClientTeamData> {
        const teamMap: Record<string, ClientTeamData> = {};

        // First pass: create team objects
        for (const [id, t] of Object.entries(_teams)) {
            teamMap[id] = {
                id: t.id,
                name: t.name,
                type: t.type,
                captainId: t.captainId ?? null,
                players: {}
            };
        }

        // Second pass: add players to their teams
        for (const [id, m] of Object.entries(_members)) {
            if (m.type === "player" && m.teamId) {
                const team = teamMap[m.teamId];
                if (team) {
                    team.players[id] = {
                        id: m.id,
                        name: m.name,
                        type: "player",
                        isActive: m.isActive ?? true,
                        isSubbed: m.isSubbed ?? false,
                    };
                }
            }
        }

        return teamMap;
    }
};

/**
 * Players store - derived from socket data
 */
export const playersStore = {
    get value(): Record<string, ClientPlayer> {
        const teams = teamsStore.value;
        const players: Record<string, ClientPlayer> = {};

        for (const [id, m] of Object.entries(_members)) {
            if (m.type === "player" && m.teamId) {
                const team = teams[m.teamId];
                if (team) {
                    players[id] = {
                        id: m.id,
                        name: m.name,
                        type: "player",
                        team,
                        isActive: m.isActive ?? true,
                        isSubbed: m.isSubbed ?? false,
                    };
                }
            }
        }

        return players;
    }
};

/**
 * Moderators store - derived from socket data
 */
export const moderatorsStore = {
    get value(): Record<string, ClientModerator> {
        const moderators: Record<string, ClientModerator> = {};

        for (const [id, m] of Object.entries(_members)) {
            if (m.type === "moderator") {
                moderators[id] = {
                    id: m.id,
                    name: m.name,
                    type: "moderator",
                    isActive: m.isActive ?? true
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
                team: player.team,
                isSubbed: player.isSubbed,
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
