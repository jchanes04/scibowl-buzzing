import type { Member, MemberClean } from "./Member";
import type { MemberScoreboard } from "./MemberScoreboard";

export interface IndividualTeam {
    id: string,
    name: string,
    members: Member[],
    scoreboard: MemberScoreboard,
    individual: true
}

export interface IndividualTeamClean {
    id: string,
    name: string,
    members: MemberClean[],
    scoreboard: MemberScoreboard,
    individual: true
}

export class IndividualTeam {
    constructor(id: string, member: Member) {
        this.id = id
        this.name = member.name
        this.members = [member]
        this.scoreboard = member.scoreboard
        this.individual = true
    }

    get self(): IndividualTeamClean {
        return {
            id: this.id,
            name: this.name,
            members: this.members.map(m => m.self),
            scoreboard: this.scoreboard,
            individual: this.individual
        }
    }
}