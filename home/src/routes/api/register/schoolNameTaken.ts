import { getUserFromSchoolName } from '$lib/mongo'
import type { RequestEvent } from '@sveltejs/kit'

export async function get({ url }: RequestEvent) {
    const schoolName = url.searchParams.get('schoolName')
    console.log(schoolName)
    const taken = !!(await getUserFromSchoolName(schoolName))
    return new Response(JSON.stringify({ taken }))
}