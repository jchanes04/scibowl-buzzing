import type { SvelteComponentTyped } from "svelte";
import { Writable, writable } from "svelte/store";
import type { TimerMethods } from "./timer";

const clockStore: Writable<SvelteComponentTyped & TimerMethods> = writable(null)
export default clockStore