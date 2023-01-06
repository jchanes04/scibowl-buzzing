import type { Actions } from "./$types";
import argon2 from 'argon2'
import { createUser, type User } from "$lib/mongo";
import { generateToken } from "$lib/authentication";
import { redirect } from "@sveltejs/kit";

export const actions: Actions = {
    default: async ({ request, cookies }) => {
        const body = await request.formData()
        const userData = {
            username: body.get('username') as string,
            passwordHash: await argon2.hash(body.get('password') as string),
            schoolName: body.get('school-name') as string,
            teamIds: [] as string[]
        } as User
        
        const createdUser = await createUser(userData)
        const authToken = generateToken(createdUser.id)
        cookies.set('authToken', authToken, { path: "/" })
        
        throw redirect(302, "/edit")
    }
}