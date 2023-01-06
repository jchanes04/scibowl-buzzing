import { generateToken } from "$lib/authentication";
import { getUserFromEmail, getUserPasswordHash } from "$lib/mongo";
import type { RequestHandler } from "./$types"
import argon2 from "argon2"
import { redirect } from "@sveltejs/kit";

export const POST = async function({ request, cookies }) {
    const body = await request.formData()
    const email = body.get('email') as string
    const password = body.get('password') as string
    const passwordHash = await getUserPasswordHash(email)
    console.log("pass", typeof password)
    console.log("passwordHash", typeof passwordHash)

    if (passwordHash && await argon2.verify(passwordHash, password)) {
        console.log('valid')
        const userData = await getUserFromEmail(email)
        console.log(userData)
        const authToken = generateToken(userData._id)

        return new Response(null, {
            status: 302,
            headers: {
                Location: '/',
                "Set-Cookie": `authToken=${authToken};Path=/`
            }
        })

        // cookies.set('authToken', authToken, { path: '/' })
        // throw redirect(302, '/edit')
    } else {
        console.log('invalid')
        throw redirect(302, "/")
    }
} satisfies RequestHandler