import { updateTeam } from '$lib/mongo'
import type { Actions } from './$types'
import { fail } from "@sveltejs/kit";

export const actions: Actions = {
    name: async ({ request, locals }) => {
        if (!locals.user) {
            return fail(403, { error: "Unauthorized" })
        }

        const body = await request.formData()
        const value = body.get('name') as string
        const teamId = body.get('team-id') as string

        await updateTeam(teamId, { name: value })

        return { success: true }
    }
}