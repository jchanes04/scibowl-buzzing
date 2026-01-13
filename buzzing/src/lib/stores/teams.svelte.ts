// teams.svelte.ts
import type { TeamData } from "$lib/classes/Team";

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

let teams = $state<Record<string, ClientTeamData>>({});

export default {
  get value() {
    return teams;
  },
  clear: () => {
    teams = {};
  },
  addTeam: (team: ClientTeamData) => {
    teams = { ...teams, [team.id]: team };
  },
  removeTeam: (id: string) => {
    const { [id]: _, ...rest } = teams;
    teams = rest;
  },
  getTeam: (id: string) => teams[id],
  addPlayerToTeam: (teamId: string, player: TeamPlayer) => {
    if (teams[teamId]) {
      teams = {
        ...teams,
        [teamId]: {
          ...teams[teamId],
          players: { ...teams[teamId].players, [player.id]: player },
        },
      };
    }
  },
  removePlayerFromTeam: (teamId: string, playerId: string) => {
    if (teams[teamId]) {
      const { [playerId]: _, ...rest } = teams[teamId].players;
      teams = {
        ...teams,
        [teamId]: {
          ...teams[teamId],
          players: rest,
        },
      };
    }
  },
  changeCaptain: (teamId: string, captainId: string) => {
    if (teams[teamId]) {
      teams = {
        ...teams,
        [teamId]: {
          ...teams[teamId],
          captainId,
        },
      };
    }
  },
};

export function createTeam(teamData: TeamData): ClientTeamData {
  return {
    id: teamData.id,
    name: teamData.name,
    type: teamData.type,
    captainId: teamData.captainId,
    players: {},
  };
}