import { useQuery } from 'convex-svelte';
import { api } from '../../../convex/_generated/api';

// Types matching existing stores
type TeamPlayer = {
  name: string;
  id: string;
  type: "player";
};

export type ClientTeamData = {
  id: string;
  name: string;
  type: "default" | "created" | "individual";
  captainId: string | null;
  players: Record<string, TeamPlayer>;
};

export type ClientPlayer = {
  name: string;
  id: string;
  type: "player";
  team: ClientTeamData;
};

export type ClientModerator = {
  name: string;
  id: string;
  type: "moderator";
};

export type MyMember = {
  name: string;
  id: string;
  moderator: boolean;
  team?: ClientTeamData;
};

// Convex data types
type ConvexMember = {
  id: string;
  name: string;
  type: "player" | "moderator";
  teamId?: string;
};

type ConvexTeam = {
  teamId: string;
  name: string;
  type: "default" | "created" | "individual";
  captainId?: string;
};

// Subscription state
let subscriptionGameId = $state<string | null>(null);
let _myMemberId = $state<string | null>(null);

// Internal state derived from Convex
let _members = $state<ConvexMember[]>([]);
let _teams = $state<ConvexTeam[]>([]);

// Subscription management
export function initMembersSubscription(gameId: string, memberId: string) {
  subscriptionGameId = gameId;
  _myMemberId = memberId;
}

export function clearMembersSubscription() {
  subscriptionGameId = null;
  _myMemberId = null;
  _members = [];
  _teams = [];
}

// Convex queries
export function useMembers() {
  return useQuery(
    api.gameMembers.getForGame,
    () => subscriptionGameId ? { gameId: subscriptionGameId } : 'skip'
  );
}

export function useTeams() {
  return useQuery(
    api.teams.getForGame,
    () => subscriptionGameId ? { gameId: subscriptionGameId } : 'skip'
  );
}

// Functions to update internal state from Convex queries
export function setMembers(members: ConvexMember[]) {
  _members = members;
}

export function setTeams(teams: ConvexTeam[]) {
  _teams = teams;
}

// Derived stores - computed from Convex data

// Build team map with players embedded
function buildTeamMap(): Record<string, ClientTeamData> {
  const teamMap: Record<string, ClientTeamData> = {};

  // First, create all teams
  for (const t of _teams) {
    teamMap[t.teamId] = {
      id: t.teamId,
      name: t.name,
      type: t.type,
      captainId: t.captainId ?? null,
      players: {}
    };
  }

  // Then, add players to their teams
  for (const m of _members) {
    if (m.type === "player" && m.teamId && teamMap[m.teamId]) {
      teamMap[m.teamId]!.players[m.id] = {
        id: m.id,
        name: m.name,
        type: "player"
      };
    }
  }

  return teamMap;
}

export const teamsStore = {
  get value(): Record<string, ClientTeamData> {
    return buildTeamMap();
  }
};

export const playersStore = {
  get value(): Record<string, ClientPlayer> {
    const teams = buildTeamMap();
    const players: Record<string, ClientPlayer> = {};

    for (const m of _members) {
      if (m.type === "player" && m.teamId) {
        const team = teams[m.teamId];
        if (team) {
          players[m.id] = {
            id: m.id,
            name: m.name,
            type: "player",
            team
          };
        }
      }
    }

    return players;
  }
};

export const moderatorsStore = {
  get value(): Record<string, ClientModerator> {
    const mods: Record<string, ClientModerator> = {};

    for (const m of _members) {
      if (m.type === "moderator") {
        mods[m.id] = {
          id: m.id,
          name: m.name,
          type: "moderator"
        };
      }
    }

    return mods;
  }
};

// myMember is derived - automatically updates on promotion
export const myMemberStore = {
  get value(): MyMember {
    const players = playersStore.value;
    const mods = moderatorsStore.value;

    if (_myMemberId && players[_myMemberId]) {
      const p = players[_myMemberId]!;
      return {
        id: p.id,
        name: p.name,
        moderator: false,
        team: p.team
      };
    } else if (_myMemberId && mods[_myMemberId]) {
      const m = mods[_myMemberId]!;
      return {
        id: m.id,
        name: m.name,
        moderator: true
      };
    }

    // Fallback for SSR or when data hasn't loaded yet
    return {
      id: _myMemberId ?? "",
      name: "",
      moderator: false
    };
  }
};

// Re-export types for compatibility
export type { TeamPlayer };
