import type { Request, Response } from "@sveltejs/kit";
type Resolve = (request: Request<Record<string, any>>) => Response | Promise<Response>

import { getUserFromID } from './mongo'
import { redirectTo } from "$lib/functions/redirectTo";
import { getIDFromToken } from "./authentication";

const restrictedEndpoints = ["write", "edit", "question-search", "question", "account", undefined]

export async function handle({ request, resolve }: { request: Request, resolve: Resolve }) {
    let endpoint = request.path.split("/")[1]
    let authToken = request.headers.cookie?.split("; ").find(x => x.split("=")[0] === "authToken")?.split("=")[1]
    if (authToken) request.headers.authorization = authToken

    if (restrictedEndpoints.includes(endpoint)) {
        let userID = getIDFromToken(authToken)
        let userData = await getUserFromID(userID)
        request.locals = {
            isLoggedIn: !!userID,
            userID,
            userData: {...userData}
            
        }
    }

    if (endpoint === 'question-search') {
        let previousQueryString = decodeURIComponent(request.headers.cookie?.split("; ").find(x => x.split("=")[0] === "lastQuery")?.split("=")[1])
        
        if (previousQueryString) {
            try {
                let previousQueryObject = JSON.parse(previousQueryString)
                if (previousQueryObject) request.locals.previousQuery = previousQueryObject
            } catch {}
        }
    }

    const response = await resolve(request);
    return {
        ...response
    }
}

export async function getSession(request: Request) {
    return {
        ...request.locals
    }
}