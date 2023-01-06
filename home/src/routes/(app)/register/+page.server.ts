import type { Actions } from "./$types";
import argon2 from 'argon2'
import { createUser, type User } from "$lib/mongo";
import { generateToken } from "$lib/authentication";
import { redirect, fail } from "@sveltejs/kit";
import { userSchema } from "$lib/schemas/user";

export const actions: Actions = {
    default: async ({ request, cookies }) => {
        const body = await request.formData()
        const userData = {
            email: body.get('email') as string,
            secondaryEmail: body.get('secondary-email') as string,
            password: body.get('password') as string,
            schoolName: body.get('school-name') as string
        }
        
        const parseResult = userSchema.safeParse(userData)

        if (!parseResult.success) {
            throw fail(400, { error: "Invalid user data" })
        }

        let user: Omit<User, '_id' | 'createdAt'> = {
            email: parseResult.data.email,
            passwordHash: await argon2.hash(parseResult.data.password),
            schoolName: parseResult.data.schoolName,
            teamIds: []
        }

        if (parseResult.data.secondaryEmail)
            user.secondaryEmail = parseResult.data.secondaryEmail

        const createdUser = await createUser(user)
        const authToken = generateToken(createdUser._id)
        cookies.set('authToken', authToken, { path: "/" })
        
        throw redirect(302, "/edit")
    }
}