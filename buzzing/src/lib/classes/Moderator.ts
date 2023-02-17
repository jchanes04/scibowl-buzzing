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
    type: "moderator"
}

export class Moderator {
    constructor({ name, id }: { name: string, id?: string }) {
        this.id = id || createMemberID() 
        this.name = name
        this.type = "moderator"
    }

    setSocket(socket: Socket) {
        this.socket = socket
    }

    get data(): ModeratorData {
        return {
            name: this.name,
            id: this.id,
            type: "moderator"
        }
    }
}