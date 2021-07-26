import type { Request, Response } from "@sveltejs/kit";
type Resolve = (request: Request<Record<string, any>>) => Response | Promise<Response>

import { checkAuthenticated, gameExists, getGame, io } from './server'
import { redirectTo } from "$lib/functions/redirectTo";

export async function handle({ request, resolve }: { request: Request, resolve: Resolve }) {
    let endpoint = request.path.split("/")[1]

    if (endpoint === 'game') {
        let gameID = request.path.split("/")[2]

        let memberIdCookie = request.headers.cookie?.split("; ").find(x => x.split("=")[0] === "memberID").split("=")[1]

        if (gameID === "" || gameID === undefined) return redirectTo('/create')

        if (checkAuthenticated(gameID, memberIdCookie)) {
            let game = getGame(gameID)
            if (game.leftPlayers.some(x => x.id === memberIdCookie)) {
                let member = game.rejoinMember(memberIdCookie)
                game.addChatMessage({
                    text: member.name + ' has joined the game',
                    type: 'notification'
                })
                io.to(gameID).emit('memberJoin', {
                    member: member.self,
                    team: member.team.self
                })
            }
            
            request.locals.authenticated = true
        } else {
            console.log(gameID)
            console.log(memberIdCookie)
            return redirectTo(gameExists(gameID) ? "/join/" + gameID : "/join")
        }
    } else if (endpoint === "join") {
        let gameID = request.path.split("/")[2]

        if (gameExists(gameID)) {
            let game = getGame(gameID)
            request.locals = {
                gameID,
                gameName: game.name
            }
        } else if (gameID !== '' && gameID !== undefined) {
            return redirectTo('/join')
        }
    }
    


    const response = await resolve(request);
    return {
        ...response
    }
}

export async function getSession(request: Request) {
    let endpoint = request.path.split("/")[1]
    
    if (endpoint === "join") {
        return {
            ...request.locals
        }
    }
    
    return {}
}