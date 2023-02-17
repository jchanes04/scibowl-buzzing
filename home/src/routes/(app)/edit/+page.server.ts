import { fail, redirect } from '@sveltejs/kit';
import { createTeam, getTeamsByUser, updateTeam, type Team } from '$lib/mongo';
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async function({ parent, url }) {
    const parentData = await parent()
    if (!parentData.user) {
        throw redirect(302, "/register");
    } else {
        const status = url.searchParams.get('status') as string
        return {
            teams: await getTeamsByUser(parentData.user._id),
            status
        }
    }
}

const defaultTeamData = {
    members: [],
    paid: false
}

export const actions = {
    teamName: async ({ request }) => {
        const data = await request.formData()
        const teamId = data.get('team-id') as string
        const teamName = data.get('teamName') as string
        if (!teamId || !teamName) return fail(400, {message: "Invalid team name" })

        await updateTeam(teamId, { name: teamName })
        return { success: true }
    },
    createTeam: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: "Unauthorized" })

        const data = await request.formData()
        const teamName = data.get('createTeam') as string

        const created = await createTeam({
            ...defaultTeamData,
            name: teamName,
            userId: locals.user._id
        })

        if (!created || !teamName) return fail(500, {message: "Create Team Failed" })
        
        return {
            team: created
        }
    }
} satisfies Actions