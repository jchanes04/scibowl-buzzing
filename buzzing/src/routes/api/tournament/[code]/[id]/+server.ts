import { deleteGame, getTournamentScores, updateGameName, updateGameScores } from "$lib/mongo"
import { error } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import type { NamedQuestionPairScore, NamedScores } from "$lib/functions/scoreboard"

// TODO: authentication

export const DELETE = async function({ params }) {
    await deleteGame(params.id)

    return new Response(null)
}

export const PATCH = async function({ request, params }) {
    const { teamNameChanges, playerNameChanges, newName } = await request.json() as {
        teamNameChanges: Record<string, string> | null,
        playerNameChanges: Record<string, Record<string, string>> | null,
        newName: string
    }

    if (newName) {
        await updateGameName(params.id, newName)
    }

    if (teamNameChanges && playerNameChanges) {
        const [ game ] = await getTournamentScores([ params.id ])

        if (!game) throw error(404)

        let newGameScores: NamedScores = {}

        for (const [n, question] of Object.entries(game.scores)) {
            const num = Number(n)
            newGameScores[num] = {
                category: question.category,
                tossup: newTossupData(question.tossup, teamNameChanges, playerNameChanges),
                bonus: newBonusData(question.bonus, teamNameChanges)
            }
        }

        await updateGameScores(game.gameId, game.name, newGameScores)
    }

    return new Response(null)
} satisfies RequestHandler

function newTossupData(
    tossup: NamedQuestionPairScore["tossup"],
    teamNameChanges: Record<string, string>,
    playerNameChanges: Record<string, Record<string, string>>
): NamedQuestionPairScore["tossup"] {
    return Object.fromEntries(
        Object.entries(tossup).map(([teamName, { playerName, scoreType }]) => [
            Object.hasOwn(teamNameChanges, teamName) ? teamNameChanges[teamName] : teamName,
            {
                playerName: Object.hasOwn(playerNameChanges, teamName) && Object.hasOwn(playerNameChanges[teamName]!, playerName)
                    ? playerNameChanges[teamName]?.[playerName] || playerName
                    : playerName,
                scoreType
            }
        ])
    )
}

function newBonusData(
    bonus: NamedQuestionPairScore["bonus"],
    teamNameChanges: Record<string, string>
): NamedQuestionPairScore["bonus"] {
    return bonus ? {
        teamName: Object.hasOwn(teamNameChanges, bonus.teamName) ? teamNameChanges[bonus.teamName]! : bonus.teamName,
        correct: bonus.correct
    } : null
}