import { Writable, writable } from "svelte/store";

export type ChatMessage = {
    text: string
    type: 'buzz' | 'notification' | 'warning' | 'success'
}

const chatMessagesStore: Writable<ChatMessage[]> = writable([])
export default chatMessagesStore