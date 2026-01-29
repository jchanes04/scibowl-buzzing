import { generateGameToken } from "$lib/authentication"
import { createMemberID, createTeamID } from "$lib/functions/createId"
import { getGame, getIO } from "$lib/server"
import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions, RequestEvent } from "./$types"
import { env } from "$env/dynamic/public"
import { getConvexClient, api } from "$lib/convex.server"
import { getAuthenticatedUser } from "$lib/auth.result"

// Shared bracket and team resolution functions
import { generateBracket, type MatchBracket, type BracketType } from "$lib/functions/bracketGeneration"
import { resolveMatchTeams, type BracketResult, type BracketSeed } from "$lib/functions/teamSelection"

// Get the persistent member ID for the user (returns null if none exists)
function getExistingMemberId(cookies: RequestEvent['cookies']): string | null {
    const userResult = getAuthenticatedUser(cookies)
    if (userResult.isOk()) {
        return userResult.value.id
    }

    // Check for existing persistent member ID cookie
    const existingMemberId = cookies.get("persistentMemberId")
    if (existingMemberId) {
        return existingMemberId
    }

    return null
}

// Get or create a persistent member ID for the user
function getPersistentMemberId(cookies: RequestEvent['cookies']): { memberId: string, isNew: boolean } {
    const existingMemberId = getExistingMemberId(cookies)
    if (existingMemberId) {
        return { memberId: existingMemberId, isNew: false }
    }

    // Create new persistent member ID for anonymous user
    const newMemberId = createMemberID()
    return { memberId: newMemberId, isNew: true }
}

export const load = async function ({ params, url, cookies }) {
    const { id } = params
    const code = url.searchParams.get('code')?.toUpperCase() // Normalize to uppercase
    const game = await getGame(id)

    if (!game) redirect(302, "/join")

    // Check if this is a valid join code (regular or moderator)
    const convex = getConvexClient()
    const gameData = await convex.query(api.games.getByGameId, { gameId: id })

    const isModeratorCode = gameData?.moderatorJoinCode && code === gameData.moderatorJoinCode
    const isPlayerCode = code === game.joinCode

    if (!isPlayerCode && !isModeratorCode) {
        if (game.settings.spectatorsAllowed) {
            redirect(302, "/spectate/" + id)
        } else {
            redirect(302, "/join")
        }
    }

    // Moderator status is determined solely by which code was used
    const moderator = isModeratorCode

    const memberNames = Object.values(game.players).map(x => x.name)
    const settings = game.settings
    // game.teams returns CachedTeam which already has the right shape
    const teams = Object.values(game.teams).filter(t => t.type !== "individual")

    // Check if this is a tournament game (gameData and convex already fetched above)

    let tournamentData: {
        tournamentId: string;
        teams: Array<{ teamId: string; name: string; players: string[] }>;
        matchIndex: number;
    } | null = null

    if (gameData?.tournamentId) {
        // Fetch tournament teams
        const tournamentTeams = await convex.query(api.tournaments.getTeams, {
            tournamentId: gameData.tournamentId
        })
        const tournament = await convex.query(api.tournaments.getById, {
            tournamentId: gameData.tournamentId
        })

        if (tournament && tournamentTeams) {
            const matchIndex = gameData.tournamentMatchIndex ?? 0
            const matchBracket = (gameData.tournamentMatchBracket || "winners") as MatchBracket
            const bracketSize = tournament.bracketSize || 4
            const bracketType = (tournament.bracketType || "single") as BracketType
            const winnerTakesAll = tournament.winnerTakesAll ?? true

            // Generate bracket structure using shared function
            const bracket = generateBracket({ bracketSize, bracketType, winnerTakesAll })

            // Resolve teams for this match using shared function
            const matchTeams = resolveMatchTeams(matchIndex, matchBracket, {
                bracket,
                bracketSeeds: (tournament.bracketSeeds || []) as BracketSeed[],
                results: (tournament.bracket?.results || []) as BracketResult[],
                teams: tournamentTeams,
            })

            tournamentData = {
                tournamentId: gameData.tournamentId,
                teams: matchTeams,
                matchIndex,
            }
        }
    }

    // Check if this player is already active in this game
    const memberId = getExistingMemberId(cookies)
    let existingActiveMember: { name: string; type: string; teamId?: string } | null = null
    if (memberId) {
        const existingMembers = await convex.query(api.gameMembers.getAllForGame, { gameId: id })
        const found = existingMembers.find(m => m.id === memberId && m.isActive)
        if (found) {
            existingActiveMember = {
                name: found.name,
                type: found.type,
                teamId: found.teamId,
            }
        }
    }

    return {
        gameId: id,
        memberNames,
        settings,
        teams,
        gameName: game.name,
        isTournamentGame: !!tournamentData,
        tournamentData,
        isModerator: moderator,
        alreadyJoined: existingActiveMember,
    }
} satisfies PageServerLoad

export const actions = {
    default: async function ({ request, params, cookies, url }) {
        const body = await request.formData()
        const name = body.get("name") as string
        const teamOrIndiv = body.get("team-or-indiv") as string
        const isModerator = body.get("moderator") === "true"
        const confirmReplace = body.get("confirm-replace") === "true"

        const { id: gameId } = params
        const game = await getGame(gameId)

        if (!game) return fail(400, { error: "Invalid game" })

        const convex = getConvexClient()

        // Get persistent member ID (from WorkOS or cookie)
        const { memberId: playerId, isNew: isNewMemberId } = getPersistentMemberId(cookies)

        // Check if player is already active in this game
        const existingMembers = await convex.query(api.gameMembers.getAllForGame, { gameId })
        const existingActiveMember = existingMembers.find(
            m => m.id === playerId && m.isActive
        )

        // If already active and didn't confirm replacement, reject the join
        if (existingActiveMember && !confirmReplace) {
            return fail(400, {
                error: "already_joined",
                existingName: existingActiveMember.name,
                existingType: existingActiveMember.type
            })
        }

        // If confirmed, emit 'replaced' event to disconnect their existing session
        if (existingActiveMember && confirmReplace) {
            const io = getIO()
            if (io) {
                io.to(playerId).emit('replaced')
            }
        }

        // Set cookie for new anonymous users
        if (isNewMemberId) {
            cookies.set("persistentMemberId", playerId, {
                path: "/",
                domain: (new URL(env.PUBLIC_COOKIE_URL as string)).hostname,
                maxAge: 60 * 60 * 24 * 365 * 2, // 2 years
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax"
            })
        }

        // Moderators just need a name, no team affiliation
        if (isModerator) {
            // Add moderator to Convex
            await convex.mutation(api.gameMembers.add, {
                gameId,
                memberId: playerId,
                name,
                type: "moderator",
                teamId: undefined
            })

            // Add chat message for moderator joining
            const chatMessage = game.addChatMessage({
                text: `${name} has joined as moderator`,
                type: "notification"
            })
            const io = getIO()
            if (io) {
                io.to(gameId).emit('chatMessage', chatMessage)
            }

            const gameToken = generateGameToken({ memberId: playerId, gameId }, '6h')
            cookies.set("gameToken", gameToken, {
                path: "/",
                domain: (new URL(env.PUBLIC_COOKIE_URL as string)).hostname
            })
            redirect(302, "/game/" + gameId)
        }

        // Player join logic
        let teamId: string
        let teamName: string
        let teamType: "default" | "created" | "individual" | "tournament"

        const isTournamentPlayer = body.get('tournament-player') === 'true'

        if (isTournamentPlayer && teamOrIndiv === 'team') {
            // Tournament player - team comes from tournamentTeams, may not exist in game yet
            teamId = body.get('team-id') as string

            // Try in-memory first
            const existingTeam = game.teams[teamId]
            if (existingTeam) {
                teamName = existingTeam.name
                teamType = existingTeam.type
            } else {
                // Fetch from Convex tournamentTeams using getTeamById
                const tournamentTeam = await convex.query(api.tournaments.getTeamById, { teamId })
                if (!tournamentTeam) {
                    return fail(400, { error: "Tournament team not found" })
                }

                const gameData = await convex.query(api.games.getByGameId, { gameId })
                if (!gameData?.tournamentId) {
                    return fail(400, { error: "Tournament game not found" })
                }

                teamName = tournamentTeam.name || "Team"
                teamType = "tournament"

                // Create the team in the game (Convex + in-memory)
                // Use tournamentTeamId as the teamId for consistent tracking across games
                await convex.mutation(api.teams.add, {
                    gameId,
                    teamId,  // This is the tournamentTeamId
                    name: teamName,
                    type: "tournament",
                    tournamentId: gameData.tournamentId,
                    playerNames: tournamentTeam.players || [],
                })
            }
        } else if (teamOrIndiv === 'team') {
            // Join existing team
            teamId = body.get('team-id') as string
            const existingTeam = game.teams[teamId]
            if (!existingTeam) {
                return fail(400, { error: "Invalid team" })
            }
            teamName = existingTeam.name
            teamType = existingTeam.type
        } else if (teamOrIndiv === 'new-team') {
            // Create new team
            teamId = createTeamID()
            teamName = body.get('new-team-name') as string
            teamType = "created"

            // Add new team to Convex
            await convex.mutation(api.teams.add, {
                gameId,
                teamId,
                name: teamName,
                type: "created"
            })
        } else {
            // Individual player - create individual team
            teamId = createTeamID()
            teamName = name
            teamType = "individual"

            // Add individual team to Convex
            await convex.mutation(api.teams.add, {
                gameId,
                teamId,
                name: teamName,
                type: "individual"
            })
        }

        // Add player to Convex
        await convex.mutation(api.gameMembers.add, {
            gameId,
            memberId: playerId,
            name,
            type: "player",
            teamId
        })

        // Check if player is joining mid-game - if so, backfill subbed scores for prior questions
        const gameData = await convex.query(api.games.getByGameId, { gameId })
        if (gameData && gameData.scores && Object.keys(gameData.scores).length > 0) {
            await convex.mutation(api.games.backfillSubbedScores, {
                gameId,
                playerId,
                playerName: name,
                teamId,
                teamName,
            })
        }

        // Emit socket event for instant UI update
        const playerData = { id: playerId, name, type: "player" as const, teamID: teamId }
        const teamData = { id: teamId, name: teamName, type: teamType, captainId: null }

        // Add chat message for player joining (stores in game memory and emits via socket)
        const chatMessage = game.addChatMessage({
            text: `${name} has joined the game`,
            type: "notification"
        })
        const io = getIO()
        if (io) {
            io.to(gameId).emit('chatMessage', chatMessage)
        }

        const gameToken = generateGameToken({ memberId: playerId, gameId }, '6h')
        cookies.set("gameToken", gameToken, {
            path: "/",
            domain: (new URL(env.PUBLIC_COOKIE_URL as string)).hostname
        })
        redirect(302, "/game/" + gameId)
    }
} satisfies Actions