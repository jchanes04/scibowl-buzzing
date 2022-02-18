import { getUser } from '$lib/mongo'
import type { RequestEvent, ResolveOpts } from '@sveltejs/kit'

type MaybePromise<T> = T | Promise<T>

export async function handle({ event, resolve }: { event: RequestEvent, resolve: (event: RequestEvent, opts?: ResolveOpts) => MaybePromise<Response> }) {
    const authToken = event.request.headers.get('cookie')?.split("; ").find(x => x.split("=")[0] === "authToken")?.split("=")[1]
    event.locals.userData = await getUser(authToken || event.request.headers.get('authorization'))

    if (event.request.url.startsWith('/register') && event.locals.userData) {
        return new Response(null, {
            headers: {
                'Location': '/edit'
            },
            status: 302
        })
    } else if (event.request.url.startsWith('/edit') && !event.locals.userData) {
        return new Response(null, {
            headers: {
                'Location': '/register'
            },
            status: 302
        })
    }

    return await resolve(event)
}

export async function getSession(event: RequestEvent) {
    const { passwordHash: _, ...withoutPassword } = event.locals.userData
    return {
        loggedIn: !!event.locals.userData,
        userData: withoutPassword
    }
}