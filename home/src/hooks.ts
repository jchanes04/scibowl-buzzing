import { getUserFromToken } from '$lib/authentication'
import type { RequestEvent, ResolveOpts } from '@sveltejs/kit'

type MaybePromise<T> = T | Promise<T>

const restrictedEndpoints = ['/api/teams']

export async function handle({ event, resolve }: { event: RequestEvent, resolve: (event: RequestEvent, opts?: ResolveOpts) => MaybePromise<Response> }) {
    const authToken = event.request.headers.get('cookie')?.split("; ").find(x => x.split("=")[0] === "authToken")?.split("=")[1]
    event.locals.userData = await getUserFromToken(authToken || event.request.headers.get('authorization'))

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
    } else if (restrictedEndpoints.some(e => event.request.url.startsWith(e))) {
        return new Response(null, {
            status: 403
        })
    }

    return await resolve(event)
}

export async function getSession(event: RequestEvent) {
    return {
        loggedIn: !!event.locals.userData,
        userData: event.locals.userData
    }
}