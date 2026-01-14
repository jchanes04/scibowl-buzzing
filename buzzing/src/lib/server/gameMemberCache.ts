import { getConvexRealtimeClient, api } from '$lib/convex.server';

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
  memberUnsubscribe?: () => void;
  teamUnsubscribe?: () => void;
};

const gameCache: Record<string, GameCache> = {};

export function subscribeToGame(gameId: string): void {
  if (gameCache[gameId]) return; // Already subscribed

  const client = getConvexRealtimeClient();

  gameCache[gameId] = {
    members: {},
    teams: {},
  };

  // Subscribe to members
  gameCache[gameId].memberUnsubscribe = client.onUpdate(
    api.gameMembers.getForGame,
    { gameId },
    (members) => {
      if (members) {
        gameCache[gameId]!.members = Object.fromEntries(
          members.map((m) => [m.id, m as CachedMember])
        );
      }
    }
  );

  // Subscribe to teams
  gameCache[gameId].teamUnsubscribe = client.onUpdate(
    api.teams.getForGame,
    { gameId },
    (teams) => {
      if (teams) {
        gameCache[gameId]!.teams = Object.fromEntries(
          teams.map((t) => [t.teamId, { ...t, id: t.teamId } as CachedTeam])
        );
      }
    }
  );
}

export function unsubscribeFromGame(gameId: string): void {
  const cache = gameCache[gameId];
  if (cache) {
    cache.memberUnsubscribe?.();
    cache.teamUnsubscribe?.();
    delete gameCache[gameId];
  }
}

export function getMemberFromCache(gameId: string, memberId: string): CachedMember | null {
  return gameCache[gameId]?.members[memberId] ?? null;
}

export function getTeamFromCache(gameId: string, teamId: string): CachedTeam | null {
  return gameCache[gameId]?.teams[teamId] ?? null;
}

export function getPlayersFromCache(gameId: string): Record<string, CachedMember> {
  const members = gameCache[gameId]?.members ?? {};
  return Object.fromEntries(
    Object.entries(members).filter(([_, m]) => m.type === "player")
  );
}

export function getModeratorsFromCache(gameId: string): Record<string, CachedMember> {
  const members = gameCache[gameId]?.members ?? {};
  return Object.fromEntries(
    Object.entries(members).filter(([_, m]) => m.type === "moderator")
  );
}

export function getTeamsFromCache(gameId: string): Record<string, CachedTeam> {
  return gameCache[gameId]?.teams ?? {};
}

export function getAllMembersFromCache(gameId: string): Record<string, CachedMember> {
  return gameCache[gameId]?.members ?? {};
}

export function getAllTeamsFromCache(gameId: string): CachedTeam[] {
  const teams = gameCache[gameId]?.teams ?? {};
  return Object.values(teams);
}
