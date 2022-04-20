import type { GameSettings } from "$lib/classes/Game";
import type { MemberData } from "$lib/classes/Member";
import type { TeamData } from "$lib/classes/Team";
import { Writable, writable } from "svelte/store";

export type GameInfo = {
    gameName: string,
    gameId: string,
    joinCode: string,
    settings: GameSettings,
    myTeam: TeamData,
    myMember: MemberData
}

const gameInfoStore: Writable<GameInfo> = writable(null)
export default gameInfoStore
