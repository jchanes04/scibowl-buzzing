import { createGameID } from "$lib/functions/createId"
import { GameScoreboard } from "./GameScoreboard"
import type { Member } from "./Member"

export interface Game {
    id: string,
    joinCode: string,

    name: string,
    scoreboard: GameScoreboard

    owner: Member,
    members: Member[]
}

export class Game {
    constructor({ name, ownerMember, joinCode }: { name: string, ownerMember: Member, joinCode: string }) {
        this.id = createGameID()
        this.joinCode = joinCode

        this.name = name

        this.scoreboard = new GameScoreboard({})
        
        this.owner = ownerMember
        this.members = [ownerMember]
    }

    addMember(member: Member) {
        if (this.members.some(x => x.id === member.id)) throw new Error("Member is already in the game")

        this.members = [...this.members, member]
        return this.members
    }

    removeMember(id: string) {
        let member = this.members.find(x => x.id === id)
        this.members = this.members.filter(x => x.id !== id)
        return member || null
    }
}