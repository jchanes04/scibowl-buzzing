import type { RequestEvent } from "@sveltejs/kit";
import { updateNameOnQuestions, updateUser, User } from "$lib/mongo";

export async function post({ request, locals }: RequestEvent) {
    const formData = await request.formData()
    const username = formData.get('username') as string
    
    if (username) {
        await updateUser(locals.userData.id, { username: username.trim() })
        await updateNameOnQuestions(locals.userData.id, username.trim())

        return {
            status: 200,
            body: {
                user: {
                    id: locals.userData.id,
                    username: username.trim()
                } as Partial<User>
            }
        }
    }
}