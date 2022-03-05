import { getUserFromSchoolName } from '$lib/mongo'
import type { RequestEvent } from '@sveltejs/kit'

export async function get({ url }: RequestEvent) {
    const schoolName = url.searchParams.get('schoolName')
    const taken = await getUserFromSchoolName(schoolName)? true : false
    return new Response(JSON.stringify({ taken:taken }))
}