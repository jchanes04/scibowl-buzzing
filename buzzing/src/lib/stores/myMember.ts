import { writable } from "svelte/store";
import type { ModeratorStore } from "./moderators";
import type { PlayerStore } from "./players";
import type { TeamStore } from "./teams";

export type MyMember = {
    name: string,
    id: string,
    moderator: boolean,
    team?: TeamStore
}

const store = writable<MyMember>()

type SetParams = {
    memberStore: ModeratorStore,
    moderator: true
} | {
    memberStore: PlayerStore,
    moderator: false
}

export default {
    subscribe: store.subscribe,
    setMember({ memberStore, moderator }: SetParams) {
        memberStore.subscribe(value => {
            store.set({
                ...value,
                moderator
            })
        })
    }
}