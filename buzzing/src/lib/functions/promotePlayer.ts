import type { MemberData } from "$lib/classes/Member";
import socketStore from '$lib/stores/socket'
import type { Socket } from "socket.io-client";

let socket: Socket
socketStore.subscribe(value => {
    socket = value
})

export default function promotePlayer(member: MemberData) {
    socket.emit('promotePlayer', member.id)
}