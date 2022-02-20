import type { RequestEvent, ResolveOpts } from "@sveltejs/kit";

type MaybePromise<T> = T | Promise<T>

import { gameExists, getGame } from '$lib/server'
import { redirectTo } from "$lib/functions/redirectTo";
import { getUserFromToken } from "$lib/authentication";

export async function handle({ event, resolve }: { event: RequestEvent, resolve: (event: RequestEvent, opts?: ResolveOpts) => MaybePromise<Response> }) {
    if (event.url.pathname.startsWith('/game')) {
        const gameID = event.url.pathname.slice("/game/".length)
        const authToken = event.request.headers.get('Cookie')?.split("; ").find(x => x.split("=")[0] === "authToken")?.split("=")[1]
        const tokenMember = await getUserFromToken(authToken)
        if (tokenMember) {
            event.locals.authenticated = true
            event.locals.memberData = tokenMember.data
        } else {
            return redirectTo(gameExists(gameID) ? "/join/" + gameID : "/join")
        }
    } else if (event.url.pathname.startsWith('/join')) {
        const gameID = event.url.pathname.slice("/join/".length)
        console.log(gameID)

        if (gameExists(gameID)) {
            const game = getGame(gameID)
            event.locals = {
                gameID,
                gameName: game.name
            }
        } else if (gameID !== '' && gameID !== undefined) {
            return redirectTo('/join')
        }
    } else if (event.url.pathname.startsWith('/api/game')) {
        const gameID = event.url.pathname.slice("/game/".length)
        const authToken = event.request.headers.get('Cookie')?.split("; ").find(x => x.split("=")[0] === "authToken")?.split("=")[1]
        const tokenMember = await getUserFromToken(authToken)
        if (tokenMember) {
            event.locals.authenticated = true
            event.locals.memberData = tokenMember.data
        } else {
            return new Response(null, {
                status: 404
            })
        }
    }

    const response = await resolve(event);
    return response
}

export async function getSession(event: RequestEvent) {
    return {
        ...event.locals
    }
}