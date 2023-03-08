import "$lib/mongo";
import "$lib/mail"

import { getUserFromToken } from "$lib/authentication"
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async function({ event, resolve }) {
    const { cookies } = event
    const gameToken = cookies.get('gameToken')
  
    if (gameToken) {
        const user = await getUserFromToken(gameToken)
        event.locals.user = user ?? null
    } else {
        event.locals.user = null
    }
    
    const response = await resolve(event)  
    return response
}