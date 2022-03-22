import { Writable, writable } from "svelte/store"

export type ModalData = {
    title: string,
    message: string,
    options: {
        text: string,
        callback: (...args: any[]) => void
    }[]
}

const modalStore: Writable<ModalData | null> = writable(null)
export default modalStore