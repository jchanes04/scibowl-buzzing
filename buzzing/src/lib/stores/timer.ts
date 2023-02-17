import type { SvelteComponentTyped } from "svelte";
import { type Writable, writable } from "svelte/store";

export type TimerMethods = {
    start: (length: number) => void,
    pause: () => void,
    resume: () => void,
    end: () => void
}

const timerStore: Writable<SvelteComponentTyped & TimerMethods | null> = writable(null)
export default timerStore