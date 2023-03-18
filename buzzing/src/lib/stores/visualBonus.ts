import { writable } from "svelte/store";

export default writable<{ url: string | null, window: Window | null }>({
    url: null,
    window: null
})