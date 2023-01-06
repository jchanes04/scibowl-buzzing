import { getUserFromSchoolName } from '$lib/mongo'
import { RequestHandler } from "./$types"

export async function GET({ url }) {
    const schoolName = url.searchParams.get('schoolName')
    const taken = await getUserFromSchoolName(schoolName)? true : false
    return new Response(JSON.stringify({ taken:taken }))
} satisfies RequestHandler