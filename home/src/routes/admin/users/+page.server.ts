import { getAllUsers } from '$lib/mongo'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async function({ parent }) {
    await parent()
    const users = await getAllUsers()
    return {
        users
    }
}