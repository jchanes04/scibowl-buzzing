import type { PlayerData } from "$lib/classes/Player";
import type { ClientTeamData } from "./teams.svelte";

export type ClientPlayer = {
  name: string;
  id: string;
  type: "player";
  team: ClientTeamData;
};

let players = $state<Record<string, ClientPlayer>>({});

export default {
  get value() {
    return players;
  },
  clear: () => {
    players = {};
  },
  addPlayer: (player: ClientPlayer) => {
    players = { ...players, [player.id]: player };
  },
  removePlayer: (id: string) => {
    const { [id]: _, ...rest } = players;
    players = rest;
  },
  getPlayer: (id: string) => players[id],
  renamePlayer: (id: string, name: string) => {
    if (players[id]) {
      players = {
        ...players,
        [id]: { ...players[id], name },
      };
    }
  },
};

export function createPlayer(
  data: PlayerData,
  team: ClientTeamData
): ClientPlayer {
  return {
    name: data.name,
    id: data.id,
    type: "player",
    team,
  };
}