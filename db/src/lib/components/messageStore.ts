type Message = {
    text: string
    type: 'buzz' | 'notification' | 'warning' | 'success'
}

import { Writable, writable } from 'svelte/store'
export const messages: Writable<Message[]> = writable([{
    text: "New Game created",
    type: 'notification'
}])