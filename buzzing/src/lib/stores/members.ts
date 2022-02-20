import type { MemberData } from "$lib/classes/Member";
import { derived, Readable } from "svelte/store";
import teamsStore from "./teams";

const membersStore: Readable<MemberData[]> = derived(teamsStore, $teams => $teams.map(t => t.members).flat())
export default membersStore