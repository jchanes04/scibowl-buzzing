import type { Request, Response } from "@sveltejs/kit";
type Resolve = (request: Request<Record<string, any>>) => Response | Promise<Response>

import { checkAuthenticated, gameExists, getGame, io } from './server'
import { redirectTo } from "$lib/functions/redirectTo";
import type { catScores } from "$lib/classes/MemberScoreboard";
import { Member } from "$lib/classes/Member";
import { Team } from "$lib/classes/Team";

const restrictedEndpoints = ["write", "edit", "question-search", "question", "account", undefined]

type MemberInfo = {
    name: string,
    id: string,
    score: number,
    catScores: catScores,
    teamID: string
}

export async function handle({ request, resolve }: { request: Request, resolve: Resolve }) {
    let endpoint = request.path.split("/")[1]
    let authToken = request.headers.cookie?.split("; ").find(x => x.split("=")[0] === "authToken")?.split("=")[1]
    if (authToken) request.headers.authorization = authToken
    let memberCookie: MemberInfo | null = await new Promise(res => {
        try {
            let member = JSON.parse(request.headers.cookie?.split("; ").find(x => x.split("=")[0] === "memberInfo")?.split("=")[1])
            res(member as MemberInfo)
        } catch {
            res(null)
        }
    })

    if (endpoint === 'game') {
        let gameID = request.path.split("/")[2]

        let memberIdCookie = request.headers.cookie?.split("; ").find(x => x.split("=")[0] === "memberID").split("=")[1]

        if (gameID === "" || gameID === undefined) return redirectTo('/create')

        if (checkAuthenticated(gameID, memberIdCookie)) {
            let game = getGame(gameID)
            if (memberCookie && !game.members.some(m => m.id === memberCookie?.id)) {
                let memberTeam = game.teams.find((x) => {return x.id === memberCookie.teamID})
                if (!memberTeam) return redirectTo('/join/' + gameID)
                let newMember = new Member({
                    name: memberCookie.name,
                    id: memberCookie.id,
                    reader: game.owner.id === memberIdCookie,
                    score: memberCookie.score,
                    catScores: memberCookie.catScores
                })
                let member = game.addMember(newMember)

                game.addChatMessage({
                    text: newMember.name + ' has joined the game',
                    type: 'notification'
                })
                io.to(gameID).emit('memberJoin', {
                    member: newMember.self,
                    team: newMember.team.self
                })
            }
            
            request.locals.authenticated = true
        } else {
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
    return {
        ...request.locals
    }
}