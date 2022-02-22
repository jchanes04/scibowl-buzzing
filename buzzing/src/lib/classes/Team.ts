import { createTeamID } from "$lib/functions/createId";
import type { Member, MemberData } from "./Member";
import { Scoreboard, ScoreboardData } from "./Scoreboard";

export interface Team {
    id: string,
    name: string,
    members: Member[],
    scoreboard: Scoreboard,
    individual: boolean
}

export interface TeamData {
    id: string,
    name: string,
    members: MemberData[],
    scoreboard: ScoreboardData,
    individual: boolean
}

export class Team {
    constructor(name: string, individual?: boolean, members?: Member[]) {
        this.id = createTeamID()
        this.name = name
        this.members = members ?? []
        this.scoreboard = new Scoreboard({})
        this.individual = individual ?? false
    }

    addMember(member: Member) {
        this.members = [...this.members, member]
    }

    removeMember(id: string) {
        const member = this.members.find(x => x.id === id)
        this.members = this.members.filter(x => x.id !== id)
        return member || null
    }

    get data(): TeamData {
        return {
            id: this.id,
            name: this.name,
            members: this.members.map(m => m.data),
            scoreboard: this.scoreboard.data,
            individual: this.individual
        }
    }
}