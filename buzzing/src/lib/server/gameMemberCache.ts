import { getConvexRealtimeClient, api } from '../convex.server';

// Cache types
export type CachedMember = {
  id: string;
  name: string;
  type: "player" | "moderator";
  teamId?: string;
};

export type CachedTeam = {
  id: string;
  name: string;
  type: "default" | "created" | "individual";
  captainId?: string;
};

type GameCache = {
  members: Record<string, CachedMember>;
  teams: Record<string, CachedTeam>;
  unsubscribeMembers?: () => void;
  unsubscribeTeams?: () => void;
};

// Per-game cache
const gameCache: Record<string, GameCache> = {};

/**
 * Start subscriptions for a game's members and teams
 */
export function subscribeToGame(gameId: string): void {
  // Skip if already subscribed
  if (gameCache[gameId]) {
    return;
  }

  const client = getConvexRealtimeClient();

  // Initialize cache
  const cache: GameCache = {
    members: {},
    teams: {},
  };
  gameCache[gameId] = cache;

  // Subscribe to members
  const unsubscribeMembers = client.onUpdate(
    api.gameMembers.getForGame,
    { gameId },
    (members) => {
      if (!members) return;

      const memberMap: Record<string, CachedMember> = {};
      for (const m of members) {
        memberMap[m.id] = {
          id: m.id,
          name: m.name,
          type: m.type,
          teamId: m.teamId,
        };
      }
      cache.members = memberMap;
    }
  );

  // Subscribe to teams
  const unsubscribeTeams = client.onUpdate(
    api.teams.getForGame,
    { gameId },
    (teams) => {
      if (!teams) return;

      const teamMap: Record<string, CachedTeam> = {};
      for (const t of teams) {
        teamMap[t.teamId] = {
          id: t.teamId,
          name: t.name,
          type: t.type,
          captainId: t.captainId,
        };
      }
      cache.teams = teamMap;
    }
  );

  cache.unsubscribeMembers = unsubscribeMembers;
  cache.unsubscribeTeams = unsubscribeTeams;
}

/**
 * Stop subscriptions for a game and clear the cache
 */
export function unsubscribeFromGame(gameId: string): void {
  const cache = gameCache[gameId];
  if (!cache) return;

  if (cache.unsubscribeMembers) {
    cache.unsubscribeMembers();
  }
  if (cache.unsubscribeTeams) {
    cache.unsubscribeTeams();
  }

  delete gameCache[gameId];
}

/**
 * Get a specific member from cache
 */
export function getMemberFromCache(gameId: string, memberId: string): CachedMember | null {
  return gameCache[gameId]?.members[memberId] ?? null;
}

/**
 * Get a specific team from cache
 */
export function getTeamFromCache(gameId: string, teamId: string): CachedTeam | null {
  return gameCache[gameId]?.teams[teamId] ?? null;
}

/**
 * Get all players (members with type "player") from cache
 */
export function getPlayersFromCache(gameId: string): Record<string, CachedMember> {
  const cache = gameCache[gameId];
  if (!cache) return {};

  const players: Record<string, CachedMember> = {};
  for (const [id, member] of Object.entries(cache.members)) {
    if (member.type === "player") {
      players[id] = member;
    }
  }
  return players;
}

/**
 * Get all moderators from cache
 */
export function getModeratorsFromCache(gameId: string): Record<string, CachedMember> {
  const cache = gameCache[gameId];
  if (!cache) return {};

  const moderators: Record<string, CachedMember> = {};
  for (const [id, member] of Object.entries(cache.members)) {
    if (member.type === "moderator") {
      moderators[id] = member;
    }
  }
  return moderators;
}

/**
 * Get all teams from cache
 */
export function getTeamsFromCache(gameId: string): Record<string, CachedTeam> {
  return gameCache[gameId]?.teams ?? {};
}

/**
 * Check if a game has an active subscription
 */
export function hasSubscription(gameId: string): boolean {
  return gameId in gameCache;
}
