import type { ClientModerator } from "./moderators.svelte";
import type { ClientPlayer } from "./players.svelte";
import type { ClientTeamData } from "./teams.svelte";

export type MyMember = {
  name: string;
  id: string;
  moderator: boolean;
  team?: ClientTeamData;
};

let myMember = $state<MyMember>({
  name: "",
  id: "",
  moderator: false,
});

export default {
  get value() {
    return myMember;
  },
  setPlayer(player: ClientPlayer) {
    myMember = {
      name: player.name,
      id: player.id,
      moderator: false,
      team: player.team,
    };
  },
  setModerator(moderator: ClientModerator) {
    myMember = {
      name: moderator.name,
      id: moderator.id,
      moderator: true,
      team: undefined,
    };
  },
  clear() {
    myMember = {
      name: "",
      id: "",
      moderator: false,
    };
  },
};