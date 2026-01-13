import type { ModeratorData } from "$lib/classes/Moderator";

export type ClientModerator = {
  name: string;
  id: string;
  type: "moderator";
};

let moderators = $state<Record<string, ClientModerator>>({});

export default {
  get value() {
    return moderators;
  },
  clear: () => {
    moderators = {};
  },
  addModerator: (moderator: ClientModerator) => {
    moderators = { ...moderators, [moderator.id]: moderator };
  },
  removeModerator: (id: string) => {
    const { [id]: _, ...rest } = moderators;
    moderators = rest;
  },
  getModerator: (id: string) => moderators[id],
};

export function createModerator(data: ModeratorData): ClientModerator {
  return {
    name: data.name,
    id: data.id,
    type: "moderator",
  };
}