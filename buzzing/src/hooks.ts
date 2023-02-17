import { gameExists, getGame } from '$lib/server'
import { redirectTo } from "$lib/functions/redirectTo";
import { getDataFromToken } from "$lib/authentication";
import { io } from "$lib/server";
import type { Handle } from '@sveltejs/kit';

export const handle = async function({ event: { cookies, url, locals }, resolve }) {
    if (url.pathname.startsWith('/game')) {
        const gameId = url.pathname.slice("/game/".length)
        const authToken = cookies.get("authToken")
        const memberId = authToken ? (await getDataFromToken(authToken))?.memberId : null
        const game = getGame(gameId)
        const member = game?.people.find(m => m.id === memberId)

        if (member) {
            locals.myData = member.data
        } else if (game && memberId) {
            const rejoinedMember = game.rejoinMember(memberId)
            if (rejoinedMember) {
                io.to(gameId).emit('memberRejoin', { member: rejoinedMember.data, team: rejoinedMember.team?.data })
                locals.myData = rejoinedMember.data
            } else if (game.settings.spectatorsAllowed) {
                return redirectTo('/spectate/' + gameId)
            } else {
                return redirectTo("/join")
            }
        } else {
            return redirectTo("/join")
        }
    } else if (url.pathname.startsWith('/join/')) {
        const gameId = url.pathname.slice("/join/".length)

        if (gameExists(gameId)) {
            const game = getGame(gameId)
            const urlJoinCode = url.searchParams.get('code')
            if (urlJoinCode === game.joinCode) {
                locals = {
                    gameId,
                    gameName: game.name
                }
            } else if (game.settings.spectatorsAllowed) {
                return redirectTo('/spectate/' + gameId)
            } else {
                return redirectTo('/join')
            }
        } else if (gameId !== '' && gameId !== undefined) {
            return redirectTo('/join')
        }
    } else if (url.pathname.startsWith('/api/game')) {
        const gameId = url.pathname.slice("/api/game/".length)
        const authToken = request.headers.get('Cookie')?.split("; ").find(x => x.split("=")[0] === "authToken")?.split("=")[1]
        const { memberId: tokenMemberId } = await getDataFromToken(authToken)
        const game = getGame(gameId)
        const member = game?.people.find(m => m.id === tokenMemberId) 
        if (member) {
            locals.myData = member.data
        } else {
            return new Response(null, {
                status: 404
            })
        }
    } else if (url.pathname.startsWith('/spectate/')) {
        const gameId = url.pathname.slice("/api/game/".length)
        const game = getGame(gameId)
        if (!game.settings.spectatorsAllowed) {
            return redirectTo('/join')
        }
    }

    const response = await resolve(event);
    return response
} satisfies Handle