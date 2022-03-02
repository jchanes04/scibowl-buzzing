import { generateToken } from "$lib/authentication";
import { getUserFromUsername, getUserPasswordHash } from "$lib/mongo";
import type { RequestEvent } from "@sveltejs/kit";
import argon2 from "argon2"

export async function post({ request }: RequestEvent) {
    const body = await request.formData()
    const username = body.get('username') as string
    const password = body.get('password') as string
    const passwordHash = await getUserPasswordHash(username)

    console.dir({
        username,
        password,
        passwordHash
    })

    if (passwordHash && await argon2.verify(passwordHash, password)) {
        const userData = await getUserFromUsername(username)
        const authToken = generateToken(userData.id)
        return new Response(JSON.stringify({ correct: true }), {
            headers: {
                'Set-cookie': `authToken=${authToken};Path=/`
            }
        })
    } else {
        return new Response(JSON.stringify({ correct: false }))
    }
}