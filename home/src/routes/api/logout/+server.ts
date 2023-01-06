import { redirect } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"

export const GET = async function({ cookies }) {
    cookies.delete('authToken', { path: '/' })
    
    throw redirect(302, '/')
} satisfies RequestHandler