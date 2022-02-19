import type { Team } from "$lib/mongo";

export default async function deleteTeam(teamData: Team) {
    const deleteRes = await fetch('/api/teams/' + teamData.id, {
        method: "DELETE"
    })
    console.log(deleteRes.status)
}