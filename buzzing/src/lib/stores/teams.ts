import type { TeamData } from "$lib/classes/Team"
import { Writable, writable } from "svelte/store"

const teamsStore: Writable<TeamData[]> = writable([])
export default teamsStore