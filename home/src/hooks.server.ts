import { init } from "$lib/mongo";
import { getUserFromToken } from "$lib/authentication"
import type { Handle } from "@sveltejs/kit";

await init()

export const handle: Handle = async function({ event, resolve }) {
    const { cookies } = event
    const authToken = cookies.get('authToken')
  
    if (authToken) {
        const user = await getUserFromToken(authToken)
        if (user) {
            event.locals.user = user
        }
    }
    
    const response = await resolve(event)  
    return response
}