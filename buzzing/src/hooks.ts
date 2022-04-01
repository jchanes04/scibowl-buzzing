import type { RequestEvent, ResolveOpts } from "@sveltejs/kit";

type MaybePromise<T> = T | Promise<T>

import { gameExists, getGame } from '$lib/server'
import { redirectTo } from "$lib/functions/redirectTo";
import { getDataFromToken } from "$lib/authentication";
import { io } from "$lib/server";

export async function handle({ event, resolve }: { event: RequestEvent, resolve: (event: RequestEvent, opts?: ResolveOpts) => MaybePromise<Response> }) {
    if (event.url.pathname.startsWith('/game')) {
        const gameId = event.url.pathname.slice("/game/".length)
        const authToken = event.request.headers.get('Cookie')?.split("; ").find(x => x.split("=")[0] === "authToken")?.split("=")[1]
        const memberId = (await getDataFromToken(authToken))?.memberId
        const game = getGame(gameId)
        const member = game?.people.find(m => m.id === memberId)

        if (member) {
            event.locals.authenticated = true
            event.locals.memberData = member.data
        } else if (game) {
            const rejoinedMember = game.rejoinMember(memberId)
            if (rejoinedMember) {
                io.to(gameId).emit('memberRejoin', { member: rejoinedMember.data, team: rejoinedMember.team?.data })
                event.locals.authenticated = true
                event.locals.memberData = rejoinedMember.data
            } else {
                return redirectTo(gameExists(gameId) ? "/join/" + gameId : "/join")
            }
        } else {
            return redirectTo(gameExists(gameId) ? "/join/" + gameId : "/join")
        }
    } else if (event.url.pathname.startsWith('/join')) {
        const gameId = event.url.pathname.slice("/join/".length)

        if (gameExists(gameId)) {
            const game = getGame(gameId)
            event.locals = {
                gameId,
                gameName: game.name
            }
        } else if (gameId !== '' && gameId !== undefined) {
            return redirectTo('/join')
        }
    } else if (event.url.pathname.startsWith('/api/game')) {
        const gameId = event.url.pathname.slice("/api/game/".length)
        const authToken = event.request.headers.get('Cookie')?.split("; ").find(x => x.split("=")[0] === "authToken")?.split("=")[1]
        const { memberId } = await getDataFromToken(authToken)
        const game = getGame(gameId)
        const member = game.people.find(m => m.id === memberId) 
        if (member) {
            event.locals.authenticated = true
            event.locals.memberData = member.data
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