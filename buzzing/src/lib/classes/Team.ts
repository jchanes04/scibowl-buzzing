import { createTeamID } from "$lib/functions/createId";
import type { Member, MemberClean } from "./Member";
import { TeamScoreboard } from "./TeamScoreboard";

export interface Team {
    id: string,
    name: string,
    members: Member[],
    scoreboard: TeamScoreboard,
    individual: false
}

export interface TeamClean {
    id: string,
    name: string,
    members: MemberClean[],
    scoreboard: TeamScoreboard,
    individual: false
}

export class Team {
    constructor(name: string) {
        this.id = createTeamID()
        this.name = name
        this.members = []
        this.scoreboard = new TeamScoreboard()
        this.individual = false
    }

    addMember(member: Member) {
        this.members = [...this.members, member]
    }

    removeMember(id: string) {
        const member = this.members.find(x => x.id === id)
        this.members = this.members.filter(x => x.id !== id)
        return member || null
    }

    get self(): TeamClean {
        return {
            id: this.id,
            name: this.name,
            members: this.members.map(m => m.self),
            scoreboard: this.scoreboard,
            individual: this.individual
        }
    }
}