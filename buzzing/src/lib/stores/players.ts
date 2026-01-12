import { ClientPlayer } from "$lib/classes/client/ClientPlayer";
import type { PlayerData } from "$lib/classes/Player";
import { writable, type Unsubscriber, type Writable } from "svelte/store";
import type { TeamStore } from "./teams";

const store = writable<Record<string, ClientPlayer & { store: PlayerStore }>>({})
let unsubscribeFunctions: Record<string, Unsubscriber> = {}

export default {
    subscribe: store.subscribe,
    clear: () => store.set({}),
    addPlayer: (player: PlayerStore) => {
        unsubscribeFunctions[player.id] = player.subscribe(newPlayerValue => {
            store.update(oldList => ({
                ...oldList,
                [player.id]: {
                    ...newPlayerValue,
                    store: player,
                    rename: newPlayerValue.rename.bind(newPlayerValue)
                }
            }))
        })
    },
    removePlayer: (id: string) => {
        unsubscribeFunctions[id]?.()
        store.update(oldList => Object.fromEntries(
            Object.entries(oldList).filter(([k, ]) => k !== id)
        ))
    },
    renamePlayer: (id: string, name: string) => {
        store.update(players => {
            const player = players[id]
            if (player) {
                player.rename(name)
            }
            return players
        })
    }
}

export function createPlayerStore(playerData: PlayerData, team: TeamStore) {
    const store = writable<ClientPlayer>(new ClientPlayer({ ...playerData, connected: playerData.connected }, team))

    return {
        id: playerData.id,
        subscribe: store.subscribe,
        rename: (name: string) => {
            store.update(value => {
                value.rename(name)
                return value
            })
        },
        setConnected: (connected: boolean) => {
            store.update(value => {
                value.connected = connected
                return value
            })
        }
    }
}

export type PlayerStore = {
    subscribe: Writable<ClientPlayer>['subscribe'],
    setConnected: (connected: boolean) => void,
    rename: (name: string) => void,
    id: string
}