import { ClientPlayer } from "$lib/classes/client/ClientPlayer";
import type { PlayerData } from "$lib/classes/Player";
import { writable, type Unsubscriber, type Writable } from "svelte/store";
import type { TeamStore } from "./teams";

const store = writable<Record<string, ClientPlayer & { store: PlayerStore }>>({})
let unsubscribeFunctions: Record<string, Unsubscriber> = {}

export default {
    subscribe: store.subscribe,
    addPlayer: (player: PlayerStore) => {
        unsubscribeFunctions[player.id] = player.subscribe(newPlayerValue => {
            store.update(oldList => ({
                ...oldList,
                [player.id]: {
                    ...newPlayerValue,
                    store: player
                }
            }))
        })
    },
    removePlayer: (id: string) => {
        unsubscribeFunctions[id]?.()
        store.update(oldList => Object.fromEntries(
            Object.entries(oldList).filter(([k, ]) => k !== id)
        ))
    }
}

export function createPlayerStore(playerData: PlayerData, team: TeamStore) {
    const store = writable<ClientPlayer>(new ClientPlayer(playerData, team))

    return {
        id: playerData.id,
        subscribe: store.subscribe
    }
}

export type PlayerStore = {
    subscribe: Writable<ClientPlayer>['subscribe'],
    id: string
}