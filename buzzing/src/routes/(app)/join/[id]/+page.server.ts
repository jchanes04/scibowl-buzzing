import { generateGameToken } from "$lib/authentication"
import { createMemberID, createTeamID } from "$lib/functions/createId"
import { getGame, getIO } from "$lib/server"
import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"
import { env } from "$env/dynamic/public"
import { getConvexClient, api } from "$lib/convex.server"

// Bracket generation helpers (same as in tournaments.ts)
type MatchBracket = "winners" | "losers" | "grand_final";

type BracketMatch = {
    matchIndex: number;
    round: number;
    team1Seed: number | null;
    team2Seed: number | null;
    sourceMatch1?: number;
    sourceMatch2?: number;
}

type SourceMatch = {
    matchIndex: number;
    bracket: MatchBracket;
    takesWinner: boolean;
}

type DoubleEliminationMatch = {
    matchIndex: number;
    bracket: MatchBracket;
    round: number;
    team1Seed: number | null;
    team2Seed: number | null;
    sourceMatch1?: SourceMatch;
    sourceMatch2?: SourceMatch;
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

function generateDoubleEliminationMatches(bracketSize: number, grandFinalReset: boolean = true): {
    winners: DoubleEliminationMatch[];
    losers: DoubleEliminationMatch[];
    grandFinal: DoubleEliminationMatch[];
} {
    if (bracketSize < 2) return { winners: [], losers: [], grandFinal: [] }

    const numRounds = Math.ceil(Math.log2(bracketSize))
    const fullBracketSize = Math.pow(2, numRounds)
    const seedPositions = generateSeedPositions(fullBracketSize)

    // WINNERS BRACKET
    const winners: DoubleEliminationMatch[] = []
    let winnersMatchIndex = 0

    const firstRoundMatches = fullBracketSize / 2
    for (let i = 0; i < firstRoundMatches; i++) {
        const seed1 = seedPositions[i * 2] ?? 0
        const seed2 = seedPositions[i * 2 + 1] ?? 0
        winners.push({
            matchIndex: winnersMatchIndex,
            bracket: "winners",
            round: 0,
            team1Seed: seed1 > 0 && seed1 <= bracketSize ? seed1 : null,
            team2Seed: seed2 > 0 && seed2 <= bracketSize ? seed2 : null,
        })
        winnersMatchIndex++
    }

    let matchesInRound = firstRoundMatches / 2
    let previousRoundStart = 0
    for (let round = 1; round < numRounds; round++) {
        for (let i = 0; i < matchesInRound; i++) {
            winners.push({
                matchIndex: winnersMatchIndex,
                bracket: "winners",
                round,
                team1Seed: null,
                team2Seed: null,
                sourceMatch1: { matchIndex: previousRoundStart + i * 2, bracket: "winners", takesWinner: true },
                sourceMatch2: { matchIndex: previousRoundStart + i * 2 + 1, bracket: "winners", takesWinner: true },
            })
            winnersMatchIndex++
        }
        previousRoundStart += matchesInRound * 2
        matchesInRound = Math.floor(matchesInRound / 2)
    }

    const winnersFinalMatchIndex = winnersMatchIndex - 1

    // LOSERS BRACKET
    const losers: DoubleEliminationMatch[] = []
    let losersMatchIndex = 0

    const winnersMatchesByRound: number[][] = []
    let startIdx = 0
    let countInRound = firstRoundMatches
    for (let r = 0; r < numRounds; r++) {
        const matchesInThisRound: number[] = []
        for (let i = 0; i < countInRound; i++) {
            matchesInThisRound.push(startIdx + i)
        }
        winnersMatchesByRound.push(matchesInThisRound)
        startIdx += countInRound
        countInRound = Math.floor(countInRound / 2)
    }

    let losersRound = 0
    let prevLosersMatchIndices: number[] = []

    const r0Losers = winnersMatchesByRound[0] || []
    const losersR0Matches = r0Losers.length / 2

    for (let i = 0; i < losersR0Matches; i++) {
        losers.push({
            matchIndex: losersMatchIndex,
            bracket: "losers",
            round: losersRound,
            team1Seed: null,
            team2Seed: null,
            sourceMatch1: { matchIndex: r0Losers[i * 2]!, bracket: "winners", takesWinner: false },
            sourceMatch2: { matchIndex: r0Losers[i * 2 + 1]!, bracket: "winners", takesWinner: false },
        })
        prevLosersMatchIndices.push(losersMatchIndex)
        losersMatchIndex++
    }
    losersRound++

    for (let winnersRound = 1; winnersRound < numRounds; winnersRound++) {
        const winnersDropouts = winnersMatchesByRound[winnersRound] || []
        const matchesThisRound: number[] = []
        const numMatches = Math.min(prevLosersMatchIndices.length, winnersDropouts.length)

        for (let i = 0; i < numMatches; i++) {
            const dropoutIdx = winnersDropouts.length - 1 - i
            losers.push({
                matchIndex: losersMatchIndex,
                bracket: "losers",
                round: losersRound,
                team1Seed: null,
                team2Seed: null,
                sourceMatch1: { matchIndex: prevLosersMatchIndices[i]!, bracket: "losers", takesWinner: true },
                sourceMatch2: { matchIndex: winnersDropouts[dropoutIdx]!, bracket: "winners", takesWinner: false },
            })
            matchesThisRound.push(losersMatchIndex)
            losersMatchIndex++
        }
        losersRound++

        if (matchesThisRound.length > 1) {
            const consolidationMatches: number[] = []
            const numConsolidation = matchesThisRound.length / 2

            for (let i = 0; i < numConsolidation; i++) {
                losers.push({
                    matchIndex: losersMatchIndex,
                    bracket: "losers",
                    round: losersRound,
                    team1Seed: null,
                    team2Seed: null,
                    sourceMatch1: { matchIndex: matchesThisRound[i * 2]!, bracket: "losers", takesWinner: true },
                    sourceMatch2: { matchIndex: matchesThisRound[i * 2 + 1]!, bracket: "losers", takesWinner: true },
                })
                consolidationMatches.push(losersMatchIndex)
                losersMatchIndex++
            }
            losersRound++
            prevLosersMatchIndices = consolidationMatches
        } else {
            prevLosersMatchIndices = matchesThisRound
        }
    }

    const losersFinalMatchIndex = losersMatchIndex - 1

    // GRAND FINAL
    const grandFinal: DoubleEliminationMatch[] = []

    grandFinal.push({
        matchIndex: 0,
        bracket: "grand_final",
        round: 0,
        team1Seed: null,
        team2Seed: null,
        sourceMatch1: { matchIndex: winnersFinalMatchIndex, bracket: "winners", takesWinner: true },
        sourceMatch2: { matchIndex: losersFinalMatchIndex, bracket: "losers", takesWinner: true },
    })

    if (grandFinalReset) {
        grandFinal.push({
            matchIndex: 1,
            bracket: "grand_final",
            round: 1,
            team1Seed: null,
            team2Seed: null,
            sourceMatch1: { matchIndex: 0, bracket: "grand_final", takesWinner: true },
            sourceMatch2: { matchIndex: 0, bracket: "grand_final", takesWinner: false },
        })
    }

    return { winners, losers, grandFinal }
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
            const matchBracket = gameData.tournamentMatchBracket as MatchBracket | undefined
            const bracketResults = tournament.bracketResults || []
            const bracketSize = tournament.bracketSize || 4
            const bracketType = tournament.bracketType || "single"
            const grandFinalReset = tournament.grandFinalReset ?? true

            let matchTeams: Array<{ teamId: string; name: string; players: string[] }> = []

            // Helper to get team from a seed
            const getTeamFromSeed = (seed: number | null) => {
                if (seed === null || seed === 0) return null
                const seedData = tournament.bracketSeeds?.find((s: any) => s.seed === seed)
                if (!seedData) return null
                return tournamentTeams.find((t: any) => t.teamId === seedData.teamId)
            }

            if (bracketType === "double" && matchBracket) {
                // DOUBLE ELIMINATION
                const { winners, losers, grandFinal } = generateDoubleEliminationMatches(bracketSize, grandFinalReset)

                // Find the match in the correct bracket
                let thisMatch: DoubleEliminationMatch | undefined
                if (matchBracket === "winners") {
                    thisMatch = winners.find(m => m.matchIndex === matchIndex)
                } else if (matchBracket === "losers") {
                    thisMatch = losers.find(m => m.matchIndex === matchIndex)
                } else if (matchBracket === "grand_final") {
                    thisMatch = grandFinal.find(m => m.matchIndex === matchIndex)
                }

                if (thisMatch) {
                    // Helper to get winner from a double elimination match
                    const getWinnerFromDEMatch = (sourceMatchIndex: number, sourceBracket: MatchBracket): any => {
                        const result = bracketResults.find((r: any) =>
                            r.matchIndex === sourceMatchIndex && (r.bracket || undefined) === sourceBracket
                        )
                        if (result) {
                            return tournamentTeams.find((t: any) => t.teamId === result.winningTeamId)
                        }
                        // Check for bye in winners bracket first round
                        if (sourceBracket === "winners") {
                            const sourceMatch = winners.find(m => m.matchIndex === sourceMatchIndex)
                            if (sourceMatch) {
                                if (sourceMatch.team1Seed !== null && sourceMatch.team2Seed === null && !sourceMatch.sourceMatch2) {
                                    return getTeamFromSeed(sourceMatch.team1Seed)
                                }
                                if (sourceMatch.team2Seed !== null && sourceMatch.team1Seed === null && !sourceMatch.sourceMatch1) {
                                    return getTeamFromSeed(sourceMatch.team2Seed)
                                }
                            }
                        }
                        return null
                    }

                    // Helper to get loser from a double elimination match
                    const getLoserFromDEMatch = (sourceMatchIndex: number, sourceBracket: MatchBracket): any => {
                        const winnerId = getWinnerFromDEMatch(sourceMatchIndex, sourceBracket)?.teamId
                        if (!winnerId) return null

                        // Get both teams that were in the match
                        let sourceMatch: DoubleEliminationMatch | undefined
                        if (sourceBracket === "winners") {
                            sourceMatch = winners.find(m => m.matchIndex === sourceMatchIndex)
                        } else if (sourceBracket === "losers") {
                            sourceMatch = losers.find(m => m.matchIndex === sourceMatchIndex)
                        } else {
                            sourceMatch = grandFinal.find(m => m.matchIndex === sourceMatchIndex)
                        }

                        if (!sourceMatch) return null

                        // Get both teams in that match
                        const team1 = sourceMatch.team1Seed !== null
                            ? getTeamFromSeed(sourceMatch.team1Seed)
                            : (sourceMatch.sourceMatch1
                                ? (sourceMatch.sourceMatch1.takesWinner
                                    ? getWinnerFromDEMatch(sourceMatch.sourceMatch1.matchIndex, sourceMatch.sourceMatch1.bracket)
                                    : getLoserFromDEMatch(sourceMatch.sourceMatch1.matchIndex, sourceMatch.sourceMatch1.bracket))
                                : null)
                        const team2 = sourceMatch.team2Seed !== null
                            ? getTeamFromSeed(sourceMatch.team2Seed)
                            : (sourceMatch.sourceMatch2
                                ? (sourceMatch.sourceMatch2.takesWinner
                                    ? getWinnerFromDEMatch(sourceMatch.sourceMatch2.matchIndex, sourceMatch.sourceMatch2.bracket)
                                    : getLoserFromDEMatch(sourceMatch.sourceMatch2.matchIndex, sourceMatch.sourceMatch2.bracket))
                                : null)

                        // Return the one that's not the winner
                        if (team1?.teamId === winnerId) return team2
                        if (team2?.teamId === winnerId) return team1
                        return null
                    }

                    // Helper to get team from source match
                    const getTeamFromSource = (source: SourceMatch | undefined): any => {
                        if (!source) return null
                        if (source.takesWinner) {
                            return getWinnerFromDEMatch(source.matchIndex, source.bracket)
                        } else {
                            return getLoserFromDEMatch(source.matchIndex, source.bracket)
                        }
                    }

                    // Get team 1
                    if (thisMatch.team1Seed !== null) {
                        const team = getTeamFromSeed(thisMatch.team1Seed)
                        if (team) matchTeams.push(team)
                    } else {
                        const team = getTeamFromSource(thisMatch.sourceMatch1)
                        if (team) matchTeams.push(team)
                    }

                    // Get team 2
                    if (thisMatch.team2Seed !== null) {
                        const team = getTeamFromSeed(thisMatch.team2Seed)
                        if (team) matchTeams.push(team)
                    } else {
                        const team = getTeamFromSource(thisMatch.sourceMatch2)
                        if (team) matchTeams.push(team)
                    }
                }
            } else {
                // SINGLE ELIMINATION
                const matches = generateBracketMatches(bracketSize)
                const thisMatch = matches.find(m => m.matchIndex === matchIndex)

                if (thisMatch) {
                    // Helper to get winner from a previous match
                    const getWinnerFromMatch = (sourceMatchIndex: number | undefined) => {
                        if (sourceMatchIndex === undefined) return null
                        const result = bracketResults.find((r: any) => r.matchIndex === sourceMatchIndex && !r.bracket)
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