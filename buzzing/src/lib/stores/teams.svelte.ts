// Re-export from members.svelte.ts (Convex-based store)
import { teamsStore, type ClientTeamData } from "./members.svelte";
import type { TeamData } from "$lib/classes/Team";

export type { ClientTeamData };

// Re-export the store as default
export default teamsStore;

// Legacy createTeam function for compatibility
export function createTeam(teamData: TeamData): ClientTeamData {
  return {
    id: teamData.id,
    name: teamData.name,
    type: teamData.type,
    captainId: teamData.captainId,
    players: {},
  };
}
