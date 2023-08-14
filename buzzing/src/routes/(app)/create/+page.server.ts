import { generateGameToken } from "$lib/authentication"
import { createNewGame } from "$lib/server"
import { fail, redirect } from "@sveltejs/kit"
import type { Actions } from "./$types"
import { env } from "$env/dynamic/public"
import { addGameToTournament, getTournament, updateGameScores } from "$lib/mongo"
import { addNamesToScores } from "$lib/functions/scoreboard"

// TODO: zod validation

export const actions = {
    default: async function({ request, cookies }) {
        const body = await request.formData()
        const ownerName = body.get("owner-name") as string
        const gameName = body.get("game-name") as string
        const individualsAllowed = body.get("individual-teams-allowed") as string === "on"
        const newTeamsAllowed = body.get("new-teams-allowed") as string === "on"
        const spectatorsAllowed = body.get("spectators-allowed") as string === "on"
        const inTournament = body.get("in-tournament") as string === "on"
        const tournamentCode = body.get("tournament-code") as string
        const teamNames = JSON.parse(body.get('teams') as string || "[]")

        if (inTournament) {
            const tournament = await getTournament(tournamentCode)
            if (!tournament) return fail(400, { message: "InvalidTournamentCode" })
        }

        const gameData = {
            name: gameName,
            settings: {
                individualsAllowed,
                newTeamsAllowed,
                spectatorsAllowed
            },
            teamNames
        }

        const game = createNewGame(ownerName, gameData)

        const gameToken = generateGameToken({ memberId: Object.values(game.moderators)[0]!.id, gameId: game.id })
        cookies.set("gameToken", gameToken, {
            path: "/",
            domain: (new URL(env.PUBLIC_COOKIE_URL as string)).hostname
        })

        if (inTournament) {
            await addGameToTournament(tournamentCode, game.id)
            const scoresWithNames = addNamesToScores(game, game.scoreboard.scores)
            await updateGameScores(game.id, game.name, scoresWithNames)
        }

        throw redirect(302, "/game/" + game.id)
    }
} satisfies Actions