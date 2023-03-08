import type { RequestEvent, ResolveOptions } from "@sveltejs/kit";
type MaybePromise<T> = T | Promise<T>

import { getUserFromToken } from "$lib/authentication";

const restrictedEndpoints = ["/write/", "/edit/", "/question-search/", "/question/", "/account/", "/api/"]

export async function handle({ event, resolve }: { event: RequestEvent, resolve: (event: RequestEvent, opts?: ResolveOptions) => MaybePromise<Response> }) {
    const gameToken = event.request.headers.get('cookie')?.split("; ").find(x => x.split("=")[0] === "gameToken")?.split("=")[1]
    console.log(gameToken?.slice(0, 20))
    const userData = await getUserFromToken(gameToken)
    console.dir(userData)
    event.locals.userData = userData

    if (restrictedEndpoints.some(e => event.url.pathname.startsWith(e)) && !event.locals.userData) {
        return new Response(null, {
            status: 403
        })
    }

    return await resolve(event);
}

export async function getSession(event: RequestEvent) {
    return {
        loggedIn: !!event.locals.userData,
        userData: event.locals.userData
    }
}