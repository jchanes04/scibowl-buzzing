import { redirect } from '@sveltejs/kit';
import type { LoadInput, LoadOutput } from '@sveltejs/kit'
import type { Team } from '$lib/mongo';

export async function load({ session, fetch }:): Promise<LoadOutput> {
    if (!session.loggedIn) {
        throw redirect(302, "/register");
    } else {
        const teamIdsRes = await fetch('/api/teams')
        const teamIds = await teamIdsRes.json() as string[]
        const teamsRes = await Promise.all(teamIds.map(t => fetch('/api/teams/' + t)))
        const resolvedTeams = teamsRes.filter(t => t.status === 200)
        const teams = await Promise.all(resolvedTeams.map(t => t.json() as Promise<Team>))
        return {
            teams
        }
    }
}
