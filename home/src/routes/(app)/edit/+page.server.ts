import { fail, redirect } from '@sveltejs/kit';
import { createTeam, getTeamsByUser, updateTeam, type Team } from '$lib/mongo';
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async function({ parent }) {
    const parentData = await parent()
    if (!parentData.user) {
        throw redirect(302, "/register");
    } else {
        return {
            teams: await getTeamsByUser(parentData.user._id)
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
        return {
            team: created
        }
    }
} satisfies Actions