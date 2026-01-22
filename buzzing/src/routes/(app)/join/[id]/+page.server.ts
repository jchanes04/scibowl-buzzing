import { generateGameToken } from "$lib/authentication"
import { createMemberID, createTeamID } from "$lib/functions/createId"
import { getGame, getIO } from "$lib/server"
import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"
import { env } from "$env/dynamic/public"
import { getConvexClient, api } from "$lib/convex.server"

// Bracket generation helpers (same as in tournaments.ts)
type BracketMatch = {
    matchIndex: number;
    round: number;
    team1Seed: number | null;
    team2Seed: number | null;
    sourceMatch1?: number;
    sourceMatch2?: number;
}

function generateSeedPositions(bracketSize: number): number[] {
    if (bracketSize === 2) return [1, 2]
    const half = bracketSize / 2
    const left = generateSeedPositions(half)
    const right = generateSeedPositions(half)
    const result: number[] = []
    for (let i = 0; i < half; i++) {
        result.push(left[i]!)
        result.push(bracketSize + 1 - right[i]!)
    }
    return result
}

function generateBracketMatches(bracketSize: number): BracketMatch[] {
    const matches: BracketMatch[] = []
    const numRounds = Math.ceil(Math.log2(bracketSize))
    const fullBracketSize = Math.pow(2, numRounds)

    let matchIndex = 0
    const firstRoundMatches = fullBracketSize / 2
    const seedPositions = generateSeedPositions(fullBracketSize)

    for (let i = 0; i < firstRoundMatches; i++) {
        const seed1 = seedPositions[i * 2] ?? 0
        const seed2 = seedPositions[i * 2 + 1] ?? 0
        matches.push({
            matchIndex,
            round: 0,
            team1Seed: seed1 > 0 && seed1 <= bracketSize ? seed1 : null,
            team2Seed: seed2 > 0 && seed2 <= bracketSize ? seed2 : null,
        })
        matchIndex++
    }

    let matchesInRound = firstRoundMatches / 2
    let previousRoundStart = 0
    for (let round = 1; round < numRounds; round++) {
        for (let i = 0; i < matchesInRound; i++) {
            matches.push({
                matchIndex,
                round,
                team1Seed: null,
                team2Seed: null,
                sourceMatch1: previousRoundStart + i * 2,
                sourceMatch2: previousRoundStart + i * 2 + 1,
            })
            matchIndex++
        }
        previousRoundStart += matchesInRound * 2
        matchesInRound = Math.floor(matchesInRound / 2)
    }

    return matches
}

// Get or create a persistent member ID for the user
function getPersistentMemberId(cookies: any): { memberId: string, isNew: boolean } {
    // Check if user is logged in (has WorkOS user cookie)
    const workosUserCookie = cookies.get("workos_user")
    if (workosUserCookie) {
        try {
            const userData = JSON.parse(workosUserCookie)
            if (userData.id) {
                return { memberId: userData.id, isNew: false }
            }
        } catch (e) {
            // Fall through to anonymous handling
        }
    }

    // Check for existing persistent member ID cookie
    const existingMemberId = cookies.get("persistentMemberId")
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
            // Get teams assigned to this match based on seeds or bracket results
            const matchIndex = gameData.tournamentMatchIndex ?? 0
            const bracketResults = tournament.bracketResults || []
            const bracketSize = tournament.bracketSize || 4

            let matchTeams: Array<{ teamId: string; name: string; players: string[] }> = []

            // Generate bracket structure to find which seeds/sources are in this match
            const matches = generateBracketMatches(bracketSize)
            const thisMatch = matches.find(m => m.matchIndex === matchIndex)

            if (thisMatch) {
                // Helper to get team from a seed
                const getTeamFromSeed = (seed: number | null) => {
                    if (seed === null || seed === 0) return null
                    const seedData = tournament.bracketSeeds?.find((s: any) => s.seed === seed)
                    if (!seedData) return null
                    return tournamentTeams.find((t: any) => t.teamId === seedData.teamId)
                }

                // Helper to get winner from a previous match
                const getWinnerFromMatch = (sourceMatchIndex: number | undefined) => {
                    if (sourceMatchIndex === undefined) return null
                    const result = bracketResults.find((r: any) => r.matchIndex === sourceMatchIndex)
                    if (result) {
                        return tournamentTeams.find((t: any) => t.teamId === result.winningTeamId)
                    }
                    // Check if source match was a bye (one team has seed, other is null)
                    const sourceMatch = matches.find(m => m.matchIndex === sourceMatchIndex)
                    if (sourceMatch) {
                        if (sourceMatch.team1Seed !== null && sourceMatch.team2Seed === null) {
                            return getTeamFromSeed(sourceMatch.team1Seed)
                        }
                        if (sourceMatch.team2Seed !== null && sourceMatch.team1Seed === null) {
                            return getTeamFromSeed(sourceMatch.team2Seed)
                        }
                    }
                    return null
                }

                // Get team 1
                if (thisMatch.team1Seed !== null) {
                    const team = getTeamFromSeed(thisMatch.team1Seed)
                    if (team) matchTeams.push(team)
                } else if (thisMatch.sourceMatch1 !== undefined) {
                    const team = getWinnerFromMatch(thisMatch.sourceMatch1)
                    if (team) matchTeams.push(team)
                }

                // Get team 2
                if (thisMatch.team2Seed !== null) {
                    const team = getTeamFromSeed(thisMatch.team2Seed)
                    if (team) matchTeams.push(team)
                } else if (thisMatch.sourceMatch2 !== undefined) {
                    const team = getWinnerFromMatch(thisMatch.sourceMatch2)
                    if (team) matchTeams.push(team)
                }
            }

            tournamentData = {
                tournamentId: gameData.tournamentId,
                teams: matchTeams,
                matchIndex,
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
    }
} satisfies PageServerLoad

export const actions = {
    default: async function ({ request, params, cookies, url }) {
        const body = await request.formData()
        const name = body.get("name") as string
        const teamOrIndiv = body.get("team-or-indiv") as string
        const isModerator = body.get("moderator") === "true"

        const { id: gameId } = params
        const game = await getGame(gameId)

        if (!game) return fail(400, { error: "Invalid game" })

        const convex = getConvexClient()

        // Get persistent member ID (from WorkOS or cookie)
        const { memberId: playerId, isNew: isNewMemberId } = getPersistentMemberId(cookies)

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