import type { ClientPlayer } from "$lib/classes/client/ClientPlayer"
import { Scoreboard } from "$lib/classes/Scoreboard"
import type { TeamData } from "$lib/classes/Team"
import { derived, writable, type Readable, type Unsubscriber, type Writable } from "svelte/store"
import type { PlayerStore } from "./players"

const store = writable<Record<string, ClientTeamData & { store: TeamStore }>>({})
let unsubscribeFunctions: Record<string, Unsubscriber> = {}

export default {
    subscribe: store.subscribe,
    addTeam: (team: TeamStore) => {
        unsubscribeFunctions[team.id] = team.subscribe(newTeamValue => {
            store.update(oldList => ({
                ...oldList,
                [team.id]: {
                    ...newTeamValue,
                    store: team
                }
            }))
        })
    },
    removeTeam: (id: string) => {
        unsubscribeFunctions[id]?.()
    }
}

export type ClientTeamData = {
    id: string,
    name: string,
    type: "default" | "created" | "individual"
    scoreboard: Scoreboard,
    players: Record<string, ClientPlayer>
}

export function createTeamStore(teamData: TeamData) {
    let players = writable<Record<string, ClientPlayer>>({})
    let playerUnsubscribeFunctions: Record<string, Unsubscriber> = {}

    const teamDataStore = writable<Omit<ClientTeamData, 'players'>>({
        id: teamData.id,
        name: teamData.name,
        type: teamData.type,
        scoreboard: new Scoreboard({})
    })
    const derivedTeamStore = derived([players, teamDataStore], ([ players, data ]) => ({
        ...data,
        players
    }))
    const teamStore = {
        id: teamData.id,
        subscribe: derivedTeamStore.subscribe,
        addPlayer: (player: PlayerStore) => {
            playerUnsubscribeFunctions[player.id] = player.subscribe(newPlayerValue => {
                players.update(oldList => ({
                    ...oldList,
                    [player.id]: newPlayerValue
                }))
            })
            return players
        },
        removePlayer: (id: string) => {
            playerUnsubscribeFunctions[id]()
            players.update(oldList => Object.fromEntries(
                Object.entries(oldList).filter(([k, ]) => k !== id)
            ))
            return players
        }
    } satisfies TeamStore

    return teamStore
}

export type TeamStore = {
    id: string,
    subscribe: Readable<{
        players: Record<string, ClientPlayer>;
        id: string;
        name: string;
        type: "default" | "created" | "individual";
        scoreboard: Scoreboard;
    }>['subscribe'],
    addPlayer: (player: PlayerStore) => Writable<Record<string, ClientPlayer>>,
    removePlayer: (id: string) => Writable<Record<string, ClientPlayer>>
}