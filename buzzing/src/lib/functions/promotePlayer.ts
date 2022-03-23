import type { MemberData } from "$lib/classes/Member";
import socketStore from '$lib/stores/socket'
import type { Socket } from "socket.io-client";
import modalStore from '$lib/stores/modal'

let socket: Socket
socketStore.subscribe(value => {
    socket = value
})

export default function promotePlayer(member: MemberData) {
    modalStore.set(null)
    socket.emit('promotePlayer', member.id)
}