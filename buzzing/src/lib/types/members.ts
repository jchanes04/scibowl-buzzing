// Shared member/team types used by both server (Game.ts, socketServer.ts)
// and client (members.svelte.ts)

export type Member = {
  id: string;
  name: string;
  type: "player" | "moderator";
  teamId?: string;
  isSubbed?: boolean;
  isActive: boolean;
};

export type Team = {
  id: string;
  name: string;
  type: "default" | "created" | "individual" | "tournament";
  captainId?: string;
};
