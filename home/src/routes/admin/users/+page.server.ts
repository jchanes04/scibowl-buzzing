import { getAllTeams, getAllUsers, updateUser } from '$lib/mongo'
import type { PageServerLoad, Actions } from './$types'
import { fail } from "@sveltejs/kit";

export const load: PageServerLoad = async function({ parent }) {
    await parent()
    const users = await getAllUsers()
    const teams = await getAllTeams()
    return {
        users,
        teams
    }
}

export const actions: Actions = {
    schoolName: async ({ request, locals }) => {
        if (!locals.user) {
            return fail(403, { error: "Unauthorized" })
        }

        const body = await request.formData()
        const value = body.get('schoolName') as string
        const userId = body.get('user-id') as string

        await updateUser(userId, { schoolName: value })

        return { success: true }
    },
    email: async ({ request, locals }) => {
        if (!locals.user) {
            return fail(403, { error: "Unauthorized" })
        }

        const body = await request.formData()
        const value = body.get('email') as string
        const userId = body.get('user-id') as string

        await updateUser(userId, { email: value })

        return { success: true }
    },
    secondaryEmail: async ({ request, locals }) => {
        if (!locals.user) {
            return fail(403, { error: "Unauthorized" })
        }

        const body = await request.formData()
        const value = body.get('secondaryEmail') as string
        const userId = body.get('user-id') as string

        if (value) {
            await updateUser(userId, { secondaryEmail: value })
        } else {
            await updateUser(userId, {}, { secondaryEmail: true })
        }

        return { success: true }
    }
}