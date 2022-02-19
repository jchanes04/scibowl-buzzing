import type { Team } from "$lib/mongo";

export default async function postTeam(data: Omit<Team, 'createdAt' | 'id' | 'userId'>) {
    const createRes = await fetch('/api/teams', {
        method: "POST",
        body: JSON.stringify(data)
    })
    const createdTeam: Team = await createRes.json()
    return createdTeam
}