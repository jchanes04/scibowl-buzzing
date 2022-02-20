import type { SvelteComponentTyped } from "svelte";
import { Writable, writable } from "svelte/store";

export type TimerMethods = {
    start: (length: number) => void,
    pause: () => void,
    resume: () => void,
    end: () => void
}

const timerStore: Writable<SvelteComponentTyped & TimerMethods> = writable(null)
export default timerStore