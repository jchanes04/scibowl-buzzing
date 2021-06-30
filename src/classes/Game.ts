import { createGameID } from "src/functions/createId"
import type { Member } from "./Member"

export interface Game {
    id: string,
    joinCode: string,

    name: string,

    owner: Member,
    members: Member[]
}

export class Game {
    constructor({ name, ownerMember, joinCode }: { name: string, ownerMember: Member, joinCode: string }) {
        this.id = createGameID()
        this.joinCode = joinCode

        this.name = name
        
        this.owner = ownerMember
        this.members = [ownerMember]
    }
}