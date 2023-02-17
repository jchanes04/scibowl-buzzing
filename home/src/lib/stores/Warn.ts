import type { Member, Team } from "$lib/mongo"
import { type Writable, writable } from "svelte/store"


export type WarnState = {
    state: 'open' | 'closed' | 'accept' | 'decline',
    message: string[],
    type: 'teamRemove' | 'memberRemove' | null
    object : Team | Member | null
}

const warnStore: Writable<WarnState> = writable({
    state : 'closed',
    message : ['something went wrong'],
    type : null,
    object : null
})
export default warnStore