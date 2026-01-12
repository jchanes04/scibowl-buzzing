import { createMemberID } from "$lib/functions/createId";
import type { Socket } from "socket.io";

export interface Moderator {
    name: string,
    id: string,
    type: "moderator",
    socket?: Socket
}

export interface ModeratorData {
    name: string,
    id: string,
    type: "moderator",
    connected: boolean
}

interface ModeratorParameters {
    name: string,
    id?: string,
    connected?: boolean
}

export class Moderator {
    name: string
    id: string
    type: "moderator"
    connected: boolean

    constructor({ name, id, connected }: ModeratorParameters) {
        this.id = id || createMemberID()
        this.name = name
        this.type = "moderator"
        this.connected = connected ?? true
    }

    setSocket(socket: Socket) {
        this.socket = socket
    }

    get data(): ModeratorData {
        return {
            name: this.name,
            id: this.id,
            type: "moderator",
            connected: this.connected
        }
    }
}