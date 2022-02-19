import type { Team } from "$lib/mongo";

export default async function updateTeam(teamData: Team) {
    const updateRes = await fetch('/api/teams/' + teamData.id, {
        method: "PATCH",
        body: JSON.stringify(teamData)
    })
    console.log(updateRes.status)
}