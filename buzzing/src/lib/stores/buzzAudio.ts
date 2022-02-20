import { browser } from "$app/env";
import { writable } from "svelte/store";

const buzzAudioStore = writable(browser ? new Audio('/buzz.mp3') : null)
export default buzzAudioStore