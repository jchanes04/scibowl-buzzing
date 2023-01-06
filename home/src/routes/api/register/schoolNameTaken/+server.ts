import { getUserFromSchoolName } from '$lib/mongo'
import type { RequestHandler } from "./$types"

export const GET = async function({ url }) {
    const schoolName = url.searchParams.get('schoolName')
    const taken = await getUserFromSchoolName(schoolName)? true : false
    return new Response(JSON.stringify({ taken:taken }))
} satisfies RequestHandler