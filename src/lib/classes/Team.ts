import { createTeamID } from "$lib/functions/createId";
import type { Member } from "./Member";
import { TeamScoreboard } from "./TeamScoreboard";

export interface Team {
    id: string,
    name: string,
    members: Member[],
    scoreboard: TeamScoreboard
}

export class Team {
    constructor(name: string) {
        this.id = createTeamID()
        this.name = name
        this.members = []
        this.scoreboard = new TeamScoreboard()
    }

    addMember(member: Member) {
        this.members = [...this.members, member]
    }

    removeMember(id: string) {
        let member = this.members.find(x => x.id === id)
        this.members = this.members.filter(x => x.id !== id)
        return member || null
    }
}