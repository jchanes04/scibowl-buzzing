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
        console.log(authToken)
        let userID = getIDFromToken(authToken)
        console.log(userID)
        let userData = await getUserFromID(userID)
        request.locals = {
            isLoggedIn: !!userID,
            userID,
            userData: {...userData}
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