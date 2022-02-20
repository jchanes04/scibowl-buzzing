import type { MemberData } from "$lib/classes/Member"
import { Writable, writable } from "svelte/store"

const moderatorStore: Writable<MemberData[]> = writable([])
export default moderatorStore