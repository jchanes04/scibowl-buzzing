import { redirect } from '@sveltejs/kit';
import type { Team } from '$lib/mongo';
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async function({ fetch, parent }) {
    const parentData = await parent()
    if (!parentData.user) {
        throw redirect(302, "/register");
    } else {
        return {
            teams: [] as Team[]
        }
    }
}
