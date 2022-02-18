import type { RequestEvent } from '@sveltejs/kit'
import { createUser, getUser, User } from '$lib/mongo'
import argon2 from 'argon2'
import { generateToken } from '$lib/authentication'

export function get() {
    return new Response(null)
}

export async function post({ request }: RequestEvent) {
    const body = await request.formData()
    const userData = {
        username: body.get('username') as string,
        passwordHash: await argon2.hash(body.get('password') as string),
        schoolName: body.get('school-name') as string,
        teamIds: [] as string[]
    } as User
    
    const createdUser = await createUser(userData)
    const authToken = generateToken(createdUser.id)
    return new Response(null, {
        headers: {
            'Location': '/edit',
            'Set-Cookie': `authToken=${authToken};HttpOnly;Path=/`
        },
        status: 302
    })
}