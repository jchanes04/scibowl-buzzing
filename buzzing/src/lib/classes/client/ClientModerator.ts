import type { ModeratorData } from "../Moderator";

export interface ClientModerator {
    name: string,
    id: string,
    type: "moderator",
    connected: boolean
}

export interface ClientModeratorData {
    name: string,
    id: string,
    type: "moderator",
    connected: boolean
}

export class ClientModerator {
    constructor({ name, id, connected }: ModeratorData) {
        this.name = name,
        this.id = id
        this.type = "moderator"
        this.connected = connected
    }
}