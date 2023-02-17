import { ClientModerator } from "$lib/classes/client/ClientModerator";
import type { ModeratorData } from "$lib/classes/Moderator";
import { writable, type Unsubscriber, type Writable } from "svelte/store";

const store = writable<Record<string, ClientModerator & { store: ModeratorStore }>>({})
let unsubscribeFunctions: Record<string, Unsubscriber> = {}

export default {
    subscribe: store.subscribe,
    addModerator: (moderator: ModeratorStore) => {
        unsubscribeFunctions[moderator.id] = moderator.subscribe(newPlayerValue => {
            store.update(oldList => ({
                ...oldList,
                [moderator.id]: {
                    ...newPlayerValue,
                    store: moderator
                }
            }))
        })
    },
    removeModerator: (id: string) => {
        unsubscribeFunctions[id]?.()
        store.update(oldList => Object.fromEntries(
            Object.entries(oldList).filter(([k, ]) => k !== id)
        ))
    }
}

export function createModeratorStore(moderatorData: ModeratorData) {
    const store = writable<ClientModerator>(new ClientModerator(moderatorData))

    return {
        id: moderatorData.id,
        subscribe: store.subscribe
    }
}

export type ModeratorStore = {
    subscribe: Writable<ClientModerator>['subscribe'],
    id: string
}