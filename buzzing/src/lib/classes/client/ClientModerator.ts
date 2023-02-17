import type { ModeratorData } from "../Moderator";

export interface ClientModerator {
    name: string,
    id: string,
    type: "moderator"
}

export class ClientModerator {
    constructor({ name, id }: ModeratorData) {
        this.name = name,
        this.id = id
        this.type = "moderator"
    }
}