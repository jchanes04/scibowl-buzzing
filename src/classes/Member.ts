import { createMemberID } from "src/functions/createId";

export interface Member {
    name: string,
    id: string
}

export class Member {
    constructor({ name }: { name: string }) {
        this.id = createMemberID()
        this.name = name
    }
}