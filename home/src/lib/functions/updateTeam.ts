import type { Team } from "$lib/mongo";

export default async function updateTeam(teamData: Team) {
    await fetch('/api/teams/' + teamData._id, {
        method: "PATCH",
        body: JSON.stringify(teamData)
    })
}