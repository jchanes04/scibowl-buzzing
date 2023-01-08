import { verifyUser } from "$lib/mongo"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async function({ url }) {
    const code = url.searchParams.get('code')

    const verified = await verifyUser(code)

    return { verified }
}