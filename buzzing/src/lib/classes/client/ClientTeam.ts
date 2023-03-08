import type { ClientPlayer } from "$lib/classes/client/ClientPlayer";
import type { TeamData } from "../Team";

export interface ClientTeam {
    id: string,
    name: string,
    members: ClientPlayer[],
    captainId: string | null,
    type: "default" | "individual" | "created"
}

export class ClientTeam {
    constructor(teamData: TeamData, members: ClientPlayer[]) {
        this.id = teamData.id
        this.name = teamData.name
        this.members = members
        this.captainId = teamData.captainId
        this.type = teamData.type
    }

    addMember(member: ClientPlayer) {
        this.members = [...this.members, member]
    }
}