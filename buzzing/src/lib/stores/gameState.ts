import { Writable, writable } from "svelte/store"

export type GameState = {
    questionState: 'idle' | 'open' | 'buzzed',
    buzzedTeamIDs: string[],
    buzzingDisabled: boolean
}

const gameStateStore: Writable<GameState> = writable({
    questionState: 'idle',
    buzzedTeamIDs: [],
    buzzingDisabled: true
})
export default gameStateStore