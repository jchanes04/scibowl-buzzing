import { generateToken } from "$lib/authentication";
import { getUserFromEmail, getUserPasswordHash } from "$lib/mongo";
import { fail, redirect } from "@sveltejs/kit";
import argon2 from 'argon2'
import type { Actions } from "./$types";

export const actions: Actions = {
    login: async ({ request, cookies }) => {
        const body = await request.formData()
        const email = body.get('email') as string
        const password = body.get('password') as string
        const passwordHash = await getUserPasswordHash(email)

        if (passwordHash && await argon2.verify(passwordHash, password)) {
            const userData = await getUserFromEmail(email)
            const authToken = generateToken(userData._id)

            cookies.set('authToken', authToken, { path: '/' })
            if (userData.admin) {
                throw redirect(302, '/admin')
            } else {
                throw redirect(302, '/edit')
            }
        } else {
            return fail(400, { error: "Invalid login" })
        }
    },
    logout: async ({ cookies }) => {
        cookies.delete('authToken', { path: '/' })
    
        throw redirect(302, '/')
    }
}