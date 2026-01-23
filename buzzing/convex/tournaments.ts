import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { createGameID, createJoinCode } from "$lib/functions/createId";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Query: Get tournament by tournamentId
 */
export const getById = query({
    args: {
        tournamentId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("tournaments")
            .withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId))
            .first();
    },
});

/**
 * Query: Get all tournaments by organizer
 */
export const getByOrganizer = query({
    args: {
        organizerId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("tournaments")
            .withIndex("by_organizerId", (q) => q.eq("organizerId", args.organizerId))
            .collect();
    },
});

/**
 * Query: Get all teams registered for a tournament
 * These are teams in the tournamentTeams table (canonical registrations)
 */
export const getTeams = query({
    args: {
        tournamentId: v.string(),
    },
    handler: async (ctx, args) => {
        const teams = await ctx.db
            .query("tournamentTeams")
            .withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId))
            .collect();

        // Return in a consistent format for the frontend
        return teams.map(t => ({
            teamId: t.tournamentTeamId,
            name: t.name,
            players: t.playerNames || [],
            registeredBy: t.registeredBy,
        }));
    },
});

/**
 * Query: Get a single tournament team by its ID
 */
export const getTeamById = query({
    args: {
        teamId: v.string(),
    },
    handler: async (ctx, args) => {
        const team = await ctx.db
            .query("tournamentTeams")
            .withIndex("by_tournamentTeamId", (q) => q.eq("tournamentTeamId", args.teamId))
            .first();

        if (!team) return null;

        return {
            teamId: team.tournamentTeamId,
            tournamentId: team.tournamentId,
            name: team.name,
            players: team.playerNames || [],
            registeredBy: team.registeredBy,
        };
    },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Mutation: Create a new tournament
 */
export const create = mutation({
    args: {
        tournamentId: v.string(),
        name: v.string(),
        organizerId: v.string(),
        settings: v.object({
            spectatorsAllowed: v.boolean(),
            times: v.object({
                tossup: v.array(v.number()),
                bonus: v.array(v.number()),
                visual: v.array(v.number()),
            }),
            pointValues: v.object({
                tossup: v.number(),
                bonus: v.number(),
                penalty: v.number(),
            }),
            minPlayers: v.number(),
            maxPlayers: v.number(),
        }),
        gameIds: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("tournaments", {
            tournamentId: args.tournamentId,
            name: args.name,
            organizerId: args.organizerId,
            settings: args.settings,
            gameIds: args.gameIds,
            bracketSeeds: [],
            createdAt: Date.now(),
        });
    },
});

/**
 * Mutation: Update tournament settings
 */
export const updateSettings = mutation({
    args: {
        tournamentId: v.string(),
        settings: v.object({
            spectatorsAllowed: v.boolean(),
            times: v.object({
                tossup: v.array(v.number()),
                bonus: v.array(v.number()),
                visual: v.array(v.number()),
            }),
            pointValues: v.object({
                tossup: v.number(),
                bonus: v.number(),
                penalty: v.number(),
            }),
            minPlayers: v.number(),
            maxPlayers: v.number(),
        }),
    },
    handler: async (ctx, args) => {
        const tournament = await ctx.db
            .query("tournaments")
            .withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId))
            .first();

        if (!tournament) {
            throw new Error(`Tournament not found: ${args.tournamentId}`);
        }

        await ctx.db.patch(tournament._id, {
            settings: args.settings,
        });
    },
});

/**
 * Mutation: Update tournament name
 */
export const updateName = mutation({
    args: {
        tournamentId: v.string(),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const tournament = await ctx.db
            .query("tournaments")
            .withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId))
            .first();

        if (!tournament) {
            throw new Error(`Tournament not found: ${args.tournamentId}`);
        }

        if (tournament.bracketConfirmed) {
            throw new Error("Tournament name cannot be changed after bracket is confirmed");
        }

        await ctx.db.patch(tournament._id, {
            name: args.name,
        });
    },
});

/**
 * Mutation: Assign a team to a seed position
 */
export const assignSeed = mutation({
    args: {
        tournamentId: v.string(),
        seed: v.number(),
        teamId: v.string(),
    },
    handler: async (ctx, args) => {
        const tournament = await ctx.db
            .query("tournaments")
            .withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId))
            .first();

        if (!tournament) {
            throw new Error(`Tournament not found: ${args.tournamentId}`);
        }

        // Remove existing seed assignment for this team or position
        const filteredSeeds = (tournament.bracketSeeds || []).filter(
            (s) => s.teamId !== args.teamId && s.seed !== args.seed
        );

        // Add new seed assignment
        const newSeeds = [...filteredSeeds, { seed: args.seed, teamId: args.teamId }];

        await ctx.db.patch(tournament._id, {
            bracketSeeds: newSeeds,
        });
    },
});

/**
 * Mutation: Remove a team from a seed position
 */
export const removeSeed = mutation({
    args: {
        tournamentId: v.string(),
        seed: v.number(),
    },
    handler: async (ctx, args) => {
        const tournament = await ctx.db
            .query("tournaments")
            .withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId))
            .first();

        if (!tournament) {
            throw new Error(`Tournament not found: ${args.tournamentId}`);
        }

        const filteredSeeds = (tournament.bracketSeeds || []).filter(
            (s) => s.seed !== args.seed
        );

        await ctx.db.patch(tournament._id, {
            bracketSeeds: filteredSeeds,
        });
    },
});

/**
 * Mutation: Register a team for a tournament
 * Creates an entry in the tournamentTeams table (canonical registration)
 */
export const registerTeam = mutation({
    args: {
        tournamentId: v.string(),
        teamId: v.string(),
        name: v.string(),
        players: v.array(v.string()),
        registeredBy: v.string(),
    },
    handler: async (ctx, args) => {
        // Check tournament exists
        const tournament = await ctx.db
            .query("tournaments")
            .withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId))
            .first();

        if (!tournament) {
            throw new Error(`Tournament not found: ${args.tournamentId}`);
        }

        const minPlayers = tournament.settings?.minPlayers ?? 1;
        const maxPlayers = tournament.settings?.maxPlayers ?? 10;
        if (args.players.length < minPlayers) {
            throw new Error(`Team must have at least ${minPlayers} players`);
        }
        if (args.players.length > maxPlayers) {
            throw new Error(`Team cannot have more than ${maxPlayers} players`);
        }

        // Insert into tournamentTeams table
        return await ctx.db.insert("tournamentTeams", {
            tournamentTeamId: args.teamId,
            tournamentId: args.tournamentId,
            name: args.name,
            playerNames: args.players,
            registeredBy: args.registeredBy,
            createdAt: Date.now(),
        });
    },
});

/**
 * Mutation: Remove a registered team
 */
export const removeTeam = mutation({
    args: {
        tournamentId: v.string(),
        teamId: v.string(),
    },
    handler: async (ctx, args) => {
        // Find the team in the tournamentTeams table
        const team = await ctx.db
            .query("tournamentTeams")
            .withIndex("by_tournamentTeamId", (q) => q.eq("tournamentTeamId", args.teamId))
            .first();

        if (team && team.tournamentId === args.tournamentId) {
            await ctx.db.delete(team._id);
        }
    },
});

/**
 * Mutation: Advance a winning team to the next round
 * Called when a tournament game ends
 */
export const advanceWinner = mutation({
    args: {
        tournamentId: v.string(),
        matchIndex: v.number(), // Match index within the bracket
        bracket: v.optional(v.union(v.literal("winners"), v.literal("losers"), v.literal("grand_final"))), // For double elimination
        winningTeamId: v.string(),
    },
    handler: async (ctx, args) => {
        const tournament = await ctx.db
            .query("tournaments")
            .withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId))
            .first();

        if (!tournament) {
            throw new Error(`Tournament not found: ${args.tournamentId}`);
        }

        // Remove any existing result for this match (in case of re-run)
        // For double elimination, must match both matchIndex and bracket
        const filteredResults = (tournament.bracketResults || []).filter(
            (r) => !(r.matchIndex === args.matchIndex && (r.bracket || undefined) === args.bracket)
        );

        // Add new result
        const newResult: { matchIndex: number; bracket?: "winners" | "losers" | "grand_final"; winningTeamId: string } = {
            matchIndex: args.matchIndex,
            winningTeamId: args.winningTeamId
        };

        if (args.bracket) {
            newResult.bracket = args.bracket;
        }

        const newResults = [...filteredResults, newResult];

        await ctx.db.patch(tournament._id, {
            bracketResults: newResults,
        });
    },
});

/**
 * Mutation: Manually resolve a tie (organizer only)
 * Used when a game ends with equal scores
 */
export const resolveTie = mutation({
    args: {
        tournamentId: v.string(),
        matchIndex: v.number(),
        bracket: v.optional(v.union(v.literal("winners"), v.literal("losers"), v.literal("grand_final"))), // For double elimination
        winningTeamId: v.string(),
    },
    handler: async (ctx, args) => {
        // Same logic as advanceWinner - just a semantic alias for UI clarity
        const tournament = await ctx.db
            .query("tournaments")
            .withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId))
            .first();

        if (!tournament) {
            throw new Error(`Tournament not found: ${args.tournamentId}`);
        }

        // For double elimination, must match both matchIndex and bracket
        const filteredResults = (tournament.bracketResults || []).filter(
            (r) => !(r.matchIndex === args.matchIndex && (r.bracket || undefined) === args.bracket)
        );

        const newResult: { matchIndex: number; bracket?: "winners" | "losers" | "grand_final"; winningTeamId: string } = {
            matchIndex: args.matchIndex,
            winningTeamId: args.winningTeamId
        };

        if (args.bracket) {
            newResult.bracket = args.bracket;
        }

        const newResults = [...filteredResults, newResult];

        await ctx.db.patch(tournament._id, {
            bracketResults: newResults,
        });
    },
});

/**
 * Mutation: Save bracket structure (seeding and size)
 * This persists the current seeding state without creating games
 */
export const saveBracketStructure = mutation({
    args: {
        tournamentId: v.string(),
        bracketSeeds: v.array(v.object({
            seed: v.number(),
            teamId: v.string()
        })),
        bracketSize: v.number(),
        bracketType: v.optional(v.union(v.literal("single"), v.literal("double"))),
        grandFinalReset: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const tournament = await ctx.db
            .query("tournaments")
            .withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId))
            .first();

        if (!tournament) {
            throw new Error(`Tournament not found: ${args.tournamentId}`);
        }

        if (tournament.bracketConfirmed) {
            throw new Error("Bracket structure is already confirmed and cannot be changed");
        }

        const updates: {
            bracketSeeds: typeof args.bracketSeeds;
            bracketSize: number;
            bracketType?: "single" | "double";
            grandFinalReset?: boolean;
        } = {
            bracketSeeds: args.bracketSeeds,
            bracketSize: args.bracketSize,
        };

        if (args.bracketType !== undefined) {
            updates.bracketType = args.bracketType;
        }
        if (args.grandFinalReset !== undefined) {
            updates.grandFinalReset = args.grandFinalReset;
        }

        await ctx.db.patch(tournament._id, updates);
    },
});

/**
 * Helper: Generate match structure for a bracket
 * Returns array of matches where each match has { matchIndex, round, team1Seed, team2Seed }
 * Uses standard tournament seeding (1 vs N, 2 vs N-1, etc.)
 */
function generateBracketMatches(bracketSize: number): Array<{
    matchIndex: number;
    round: number;
    team1Seed: number | null;
    team2Seed: number | null;
    sourceMatch1?: number;
    sourceMatch2?: number;
}> {
    const matches: Array<{
        matchIndex: number;
        round: number;
        team1Seed: number | null;
        team2Seed: number | null;
        sourceMatch1?: number;
        sourceMatch2?: number;
    }> = [];

    // Calculate number of rounds
    const numRounds = Math.ceil(Math.log2(bracketSize));
    const fullBracketSize = Math.pow(2, numRounds);

    // Generate first round matches with proper seeding
    let matchIndex = 0;
    const firstRoundMatches = fullBracketSize / 2;

    // Standard tournament seeding: 1 vs N, 2 vs N-1, etc.
    // For single elimination, use standard bracket positions
    const seedPositions = generateSeedPositions(fullBracketSize);

    for (let i = 0; i < firstRoundMatches; i++) {
        const seed1 = seedPositions[i * 2] ?? 0;
        const seed2 = seedPositions[i * 2 + 1] ?? 0;
        matches.push({
            matchIndex,
            round: 0,
            team1Seed: seed1 > 0 && seed1 <= bracketSize ? seed1 : null, // BYE if seed > actual teams
            team2Seed: seed2 > 0 && seed2 <= bracketSize ? seed2 : null, // BYE if seed > actual teams
        });
        matchIndex++;
    }

    // Generate subsequent rounds
    let matchesInRound = firstRoundMatches / 2;
    let previousRoundStart = 0;
    for (let round = 1; round < numRounds; round++) {
        for (let i = 0; i < matchesInRound; i++) {
            matches.push({
                matchIndex,
                round,
                team1Seed: null, // Winners from previous round
                team2Seed: null,
                sourceMatch1: previousRoundStart + i * 2,
                sourceMatch2: previousRoundStart + i * 2 + 1,
            });
            matchIndex++;
        }
        previousRoundStart += matchesInRound * 2;
        matchesInRound = Math.floor(matchesInRound / 2);
    }

    return matches;
}

/**
 * Generate seed positions for a bracket using standard tournament seeding
 * Ensures 1 vs bracketSize, 2 vs bracketSize-1 in finals if chalk
 */
function generateSeedPositions(bracketSize: number): number[] {
    if (bracketSize === 2) return [1, 2];

    const half = bracketSize / 2;
    const left = generateSeedPositions(half);
    const right = generateSeedPositions(half);

    const result: number[] = [];
    for (let i = 0; i < half; i++) {
        result.push(left[i]!);
        result.push(bracketSize + 1 - right[i]!);
    }
    return result;
}

// Types for double elimination
type MatchBracket = "winners" | "losers" | "grand_final";

interface DoubleEliminationMatch {
    matchIndex: number;
    bracket: MatchBracket;
    round: number;
    team1Seed: number | null;
    team2Seed: number | null;
    // Source matches - can reference matches from any bracket
    sourceMatch1?: { matchIndex: number; bracket: MatchBracket; takesWinner: boolean };
    sourceMatch2?: { matchIndex: number; bracket: MatchBracket; takesWinner: boolean };
}

/**
 * Generate match structure for double elimination bracket
 * Returns separate arrays for winners, losers, and grand final brackets
 */
function generateDoubleEliminationMatches(bracketSize: number, grandFinalReset: boolean = true): {
    winners: DoubleEliminationMatch[];
    losers: DoubleEliminationMatch[];
    grandFinal: DoubleEliminationMatch[];
} {
    // Calculate number of rounds in winners bracket
    const numRounds = Math.ceil(Math.log2(bracketSize));
    const fullBracketSize = Math.pow(2, numRounds);

    // Generate seed positions
    const seedPositions = generateSeedPositions(fullBracketSize);

    // ============ WINNERS BRACKET ============
    const winners: DoubleEliminationMatch[] = [];
    let winnersMatchIndex = 0;

    // First round (with seeds)
    const firstRoundMatches = fullBracketSize / 2;
    for (let i = 0; i < firstRoundMatches; i++) {
        const seed1 = seedPositions[i * 2] ?? 0;
        const seed2 = seedPositions[i * 2 + 1] ?? 0;
        winners.push({
            matchIndex: winnersMatchIndex,
            bracket: "winners",
            round: 0,
            team1Seed: seed1 > 0 && seed1 <= bracketSize ? seed1 : null,
            team2Seed: seed2 > 0 && seed2 <= bracketSize ? seed2 : null,
        });
        winnersMatchIndex++;
    }

    // Subsequent rounds in winners bracket
    let matchesInRound = firstRoundMatches / 2;
    let previousRoundStart = 0;
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
            });
            winnersMatchIndex++;
        }
        previousRoundStart += matchesInRound * 2;
        matchesInRound = Math.floor(matchesInRound / 2);
    }

    const winnersFinalMatchIndex = winnersMatchIndex - 1;

    // ============ LOSERS BRACKET ============
    const losers: DoubleEliminationMatch[] = [];
    let losersMatchIndex = 0;

    // Losers bracket structure:
    // - For each winners round (except final), losers drop down
    // - Losers bracket has alternating "losers vs losers" and "losers vs dropdowns" rounds

    // Track matches by round for winners (for referencing losers)
    const winnersMatchesByRound: number[][] = [];
    let startIdx = 0;
    let countInRound = firstRoundMatches;
    for (let r = 0; r < numRounds; r++) {
        const matchesInThisRound: number[] = [];
        for (let i = 0; i < countInRound; i++) {
            matchesInThisRound.push(startIdx + i);
        }
        winnersMatchesByRound.push(matchesInThisRound);
        startIdx += countInRound;
        countInRound = Math.floor(countInRound / 2);
    }

    // Build losers bracket
    // Round 0: Losers from winners round 0 play each other
    // Round 1: Winners of losers round 0 play losers from winners round 1
    // Round 2: Winners of losers round 1 play each other
    // Round 3: Winner of losers round 2 plays loser from winners round 2
    // etc.

    let losersRound = 0;
    let prevLosersMatchIndices: number[] = [];

    // First losers round: R0 losers play each other
    const r0Losers = winnersMatchesByRound[0] || [];
    const losersR0Matches = r0Losers.length / 2;

    for (let i = 0; i < losersR0Matches; i++) {
        losers.push({
            matchIndex: losersMatchIndex,
            bracket: "losers",
            round: losersRound,
            team1Seed: null,
            team2Seed: null,
            sourceMatch1: { matchIndex: r0Losers[i * 2]!, bracket: "winners", takesWinner: false },
            sourceMatch2: { matchIndex: r0Losers[i * 2 + 1]!, bracket: "winners", takesWinner: false },
        });
        prevLosersMatchIndices.push(losersMatchIndex);
        losersMatchIndex++;
    }
    losersRound++;

    // Continue building losers bracket
    // For each subsequent winners round, we need:
    // 1. A round where losers bracket winners face winners dropout
    // 2. A round where those winners face each other (if more than 1)

    for (let winnersRound = 1; winnersRound < numRounds; winnersRound++) {
        const winnersDropouts = winnersMatchesByRound[winnersRound] || [];

        // Round X: Previous losers winners vs winners dropouts
        const matchesThisRound: number[] = [];
        const numMatches = Math.min(prevLosersMatchIndices.length, winnersDropouts.length);

        for (let i = 0; i < numMatches; i++) {
            // Reverse the order of dropouts to maintain bracket balance
            const dropoutIdx = winnersDropouts.length - 1 - i;
            losers.push({
                matchIndex: losersMatchIndex,
                bracket: "losers",
                round: losersRound,
                team1Seed: null,
                team2Seed: null,
                sourceMatch1: { matchIndex: prevLosersMatchIndices[i]!, bracket: "losers", takesWinner: true },
                sourceMatch2: { matchIndex: winnersDropouts[dropoutIdx]!, bracket: "winners", takesWinner: false },
            });
            matchesThisRound.push(losersMatchIndex);
            losersMatchIndex++;
        }
        losersRound++;

        // If more than 1 match, add a consolidation round
        if (matchesThisRound.length > 1) {
            const consolidationMatches: number[] = [];
            const numConsolidation = matchesThisRound.length / 2;

            for (let i = 0; i < numConsolidation; i++) {
                losers.push({
                    matchIndex: losersMatchIndex,
                    bracket: "losers",
                    round: losersRound,
                    team1Seed: null,
                    team2Seed: null,
                    sourceMatch1: { matchIndex: matchesThisRound[i * 2]!, bracket: "losers", takesWinner: true },
                    sourceMatch2: { matchIndex: matchesThisRound[i * 2 + 1]!, bracket: "losers", takesWinner: true },
                });
                consolidationMatches.push(losersMatchIndex);
                losersMatchIndex++;
            }
            losersRound++;
            prevLosersMatchIndices = consolidationMatches;
        } else {
            prevLosersMatchIndices = matchesThisRound;
        }
    }

    const losersFinalMatchIndex = losersMatchIndex - 1;

    // ============ GRAND FINAL ============
    const grandFinal: DoubleEliminationMatch[] = [];

    // Grand Final Match 1: Winners final winner vs Losers final winner
    grandFinal.push({
        matchIndex: 0,
        bracket: "grand_final",
        round: 0,
        team1Seed: null,
        team2Seed: null,
        sourceMatch1: { matchIndex: winnersFinalMatchIndex, bracket: "winners", takesWinner: true },
        sourceMatch2: { matchIndex: losersFinalMatchIndex, bracket: "losers", takesWinner: true },
    });

    // Grand Final Reset (if enabled): Only played if losers bracket champion wins GF1
    if (grandFinalReset) {
        grandFinal.push({
            matchIndex: 1,
            bracket: "grand_final",
            round: 1,
            team1Seed: null,
            team2Seed: null,
            // Both teams come from GF0 - winner and loser swap for reset
            sourceMatch1: { matchIndex: 0, bracket: "grand_final", takesWinner: true },
            sourceMatch2: { matchIndex: 0, bracket: "grand_final", takesWinner: false },
        });
    }

    return { winners, losers, grandFinal };
}


/**
 * Mutation: Confirm bracket structure and create games
 * This locks the bracket and creates all necessary games
 */
export const confirmBracketStructure = mutation({
    args: {
        tournamentId: v.string(),
    },
    handler: async (ctx, args) => {
        const tournament = await ctx.db
            .query("tournaments")
            .withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId))
            .first();

        if (!tournament) {
            throw new Error(`Tournament not found: ${args.tournamentId}`);
        }

        if (tournament.bracketConfirmed) {
            throw new Error("Bracket structure is already confirmed");
        }

        const bracketSize = tournament.bracketSize;
        if (!bracketSize || bracketSize < 2) {
            throw new Error("Bracket size must be at least 2");
        }

        const bracketType = tournament.bracketType || "single";

        // Double elimination requires power of 2 bracket size
        if (bracketType === "double") {
            const isPowerOfTwo = bracketSize > 0 && (bracketSize & (bracketSize - 1)) === 0;
            if (!isPowerOfTwo) {
                throw new Error("Double elimination brackets require a power of 2 number of teams (2, 4, 8, 16, etc.)");
            }
        }

        const bracketSeeds = tournament.bracketSeeds || [];
        if (bracketSeeds.length !== bracketSize) {
            throw new Error(`All ${bracketSize} seeds must be assigned before confirming`);
        }

        // Get tournament settings
        const settings = tournament.settings;
        if (!settings) {
            throw new Error("Tournament settings not found");
        }

        const grandFinalReset = tournament.grandFinalReset ?? true;

        const gameIds: string[] = [];
        const now = Date.now();

        if (bracketType === "double") {
            // Generate double elimination matches
            const { winners, losers, grandFinal } = generateDoubleEliminationMatches(bracketSize, grandFinalReset);

            // Helper to check if a match is a bye
            const isByeMatch = (m: DoubleEliminationMatch) => {
                const team1IsBye = m.team1Seed === null && m.sourceMatch1 === undefined;
                const team2IsBye = m.team2Seed === null && m.sourceMatch2 === undefined;
                return (team1IsBye && m.team2Seed !== null) || (team2IsBye && m.team1Seed !== null);
            };

            // Column mapping functions (same as frontend)
            const getWinnersColumnForRound = (winnersRound: number): number => {
                if (winnersRound === 0) return 1;
                return winnersRound * 2;
            };

            const getLosersColumnForRound = (losersRound: number): number => {
                return losersRound + 2;
            };

            // Get non-bye matches by round for winners bracket
            const getWinnersMatchesByRound = (round: number) =>
                winners.filter(m => m.round === round && !isByeMatch(m));

            const numRounds = Math.ceil(Math.log2(bracketSize));
            const winnersRounds = [...new Set(winners.map(m => m.round))].sort((a, b) => a - b);

            // Create games for WINNERS bracket
            for (const match of winners) {
                if (isByeMatch(match)) continue;

                const gameId = createGameID();
                const joinCode = createJoinCode();
                const moderatorJoinCode = createJoinCode();

                const matchesInRound = getWinnersMatchesByRound(match.round);
                const matchIdxInRound = matchesInRound.findIndex(m => m.matchIndex === match.matchIndex);
                const col = getWinnersColumnForRound(match.round);

                let matchName: string;
                if (match.round === winnersRounds[winnersRounds.length - 1]) {
                    matchName = `DE${col}-WF`; // Winners Final
                } else {
                    const repeatCount = Math.floor(matchIdxInRound / 26) + 1;
                    const charCode = 65 + (matchIdxInRound % 26);
                    const letter = String.fromCharCode(charCode).repeat(repeatCount);
                    matchName = `DE${col}-W${letter}`;
                }

                await ctx.db.insert("games", {
                    gameId,
                    joinCode,
                    name: `${tournament.name} - ${matchName}`,
                    settings: {
                        individualsAllowed: false,
                        newTeamsAllowed: false,
                        spectatorsAllowed: settings.spectatorsAllowed,
                    },
                    times: settings.times,
                    pointValues: settings.pointValues,
                    scores: {},
                    createdAt: now,
                    lastUpdated: now,
                    isActive: false,
                    tournamentId: args.tournamentId,
                    tournamentMatchIndex: match.matchIndex,
                    tournamentMatchBracket: "winners",
                    moderatorJoinCode,
                });

                gameIds.push(gameId);
            }

            // Get matches by round for losers bracket
            const getLosersMatchesByRound = (round: number) =>
                losers.filter(m => m.round === round);

            const losersRounds = [...new Set(losers.map(m => m.round))].sort((a, b) => a - b);

            // Create games for LOSERS bracket
            for (const match of losers) {
                const gameId = createGameID();
                const joinCode = createJoinCode();
                const moderatorJoinCode = createJoinCode();

                const matchesInRound = getLosersMatchesByRound(match.round);
                const matchIdxInRound = matchesInRound.findIndex(m => m.matchIndex === match.matchIndex);
                const col = getLosersColumnForRound(match.round);

                let matchName: string;
                if (match.round === losersRounds[losersRounds.length - 1]) {
                    matchName = `DE${col}-LF`; // Losers Final
                } else {
                    const repeatCount = Math.floor(matchIdxInRound / 26) + 1;
                    const charCode = 65 + (matchIdxInRound % 26);
                    const letter = String.fromCharCode(charCode).repeat(repeatCount);
                    matchName = `DE${col}-L${letter}`;
                }

                await ctx.db.insert("games", {
                    gameId,
                    joinCode,
                    name: `${tournament.name} - ${matchName}`,
                    settings: {
                        individualsAllowed: false,
                        newTeamsAllowed: false,
                        spectatorsAllowed: settings.spectatorsAllowed,
                    },
                    times: settings.times,
                    pointValues: settings.pointValues,
                    scores: {},
                    createdAt: now,
                    lastUpdated: now,
                    isActive: false,
                    tournamentId: args.tournamentId,
                    tournamentMatchIndex: match.matchIndex,
                    tournamentMatchBracket: "losers",
                    moderatorJoinCode,
                });

                gameIds.push(gameId);
            }

            // Create games for GRAND FINAL
            for (const match of grandFinal) {
                const gameId = createGameID();
                const joinCode = createJoinCode();
                const moderatorJoinCode = createJoinCode();

                const matchName = match.matchIndex === 0 ? "GF" : "GF Reset";

                await ctx.db.insert("games", {
                    gameId,
                    joinCode,
                    name: `${tournament.name} - ${matchName}`,
                    settings: {
                        individualsAllowed: false,
                        newTeamsAllowed: false,
                        spectatorsAllowed: settings.spectatorsAllowed,
                    },
                    times: settings.times,
                    pointValues: settings.pointValues,
                    scores: {},
                    createdAt: now,
                    lastUpdated: now,
                    isActive: false,
                    tournamentId: args.tournamentId,
                    tournamentMatchIndex: match.matchIndex,
                    tournamentMatchBracket: "grand_final",
                    moderatorJoinCode,
                });

                gameIds.push(gameId);
            }
        } else {
            // Single elimination - original logic
            const matches = generateBracketMatches(bracketSize);

            // Helper to check if a match is a bye (one team has seed, other is null with no source)
            const isByeMatch = (m: typeof matches[0]) => {
                const team1IsBye = m.team1Seed === null && m.sourceMatch1 === undefined;
                const team2IsBye = m.team2Seed === null && m.sourceMatch2 === undefined;
                return (team1IsBye && m.team2Seed !== null) || (team2IsBye && m.team1Seed !== null);
            };

            // Get non-bye matches by round
            const getMatchesByRound = (round: number) => matches.filter(m => m.round === round && !isByeMatch(m));

            // Get display rounds (rounds that have non-bye matches)
            const numRounds = Math.ceil(Math.log2(bracketSize));
            const displayRounds = Array.from({ length: numRounds }, (_, i) => i)
                .filter(round => matches.some(m => m.round === round && !isByeMatch(m)));

            // Create a game for each non-bye match
            for (const match of matches) {
                // Skip bye matches - they don't need games
                if (isByeMatch(match)) {
                    continue;
                }

                const gameId = createGameID();
                const joinCode = createJoinCode();
                const moderatorJoinCode = createJoinCode();

                // Determine match name using bracket format (SE1-A, SE2-A, Final)
                const displayRoundIdx = displayRounds.indexOf(match.round);
                const matchesInRound = getMatchesByRound(match.round);
                const matchIdxInRound = matchesInRound.findIndex(m => m.matchIndex === match.matchIndex);

                let matchName: string;
                if (displayRoundIdx === displayRounds.length - 1) {
                    matchName = "Final";
                } else {
                    const roundNumber = displayRoundIdx + 1;
                    const repeatCount = Math.floor(matchIdxInRound / 26) + 1;
                    const charCode = 65 + (matchIdxInRound % 26);
                    const letter = String.fromCharCode(charCode).repeat(repeatCount);
                    matchName = `SE${roundNumber}-${letter}`;
                }

                await ctx.db.insert("games", {
                    gameId,
                    joinCode,
                    name: `${tournament.name} - ${matchName}`,
                    settings: {
                        individualsAllowed: false,
                        newTeamsAllowed: false,
                        spectatorsAllowed: settings.spectatorsAllowed,
                    },
                    times: settings.times,
                    pointValues: settings.pointValues,
                    scores: {},
                    createdAt: now,
                    lastUpdated: now,
                    isActive: false,
                    tournamentId: args.tournamentId,
                    tournamentMatchIndex: match.matchIndex,
                    moderatorJoinCode,
                });

                gameIds.push(gameId);
            }
        }

        // Update tournament with game IDs and lock the bracket
        await ctx.db.patch(tournament._id, {
            gameIds,
            bracketConfirmed: true,
        });

        return { gameIds };
    },
});

/**
 * Mutation: Generate 26 test teams (A-Z) for testing purposes
 */
export const generateTestTeams = mutation({
    args: {
        tournamentId: v.string(),
    },
    handler: async (ctx, args) => {
        const tournament = await ctx.db
            .query("tournaments")
            .withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId))
            .first();

        if (!tournament) {
            throw new Error(`Tournament not found: ${args.tournamentId}`);
        }

        const minPlayers = tournament.settings?.minPlayers ?? 1;
        const maxPlayers = tournament.settings?.maxPlayers ?? 4; // Default to 4

        const phoneticAlphabet = [
            "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India",
            "Juliett", "Kilo", "Lima", "Mike", "November", "Oscar", "Papa", "Quebec", "Romeo",
            "Sierra", "Tango", "Uniform", "Victor", "Whiskey", "X-ray", "Yankee", "Zulu"
        ];

        const outputNames: Record<string, string[]> = {
            A: ["Alice", "Adam", "Aaron", "Amanda", "Abigail", "Alexander", "Andrew", "Anna"],
            B: ["Bob", "Barbara", "Ben", "Bianca", "Brandon", "Bella", "Blake", "Brooke"],
            C: ["Charlie", "Catherine", "Chris", "Chloe", "Caleb", "Charlotte", "Connor", "Claire"],
            D: ["David", "Diana", "Daniel", "Danielle", "Dylan", "Daisy", "Derek", "Daphne"],
            E: ["Ethan", "Emily", "Eric", "Elizabeth", "Evan", "Ella", "Elijah", "Emma"],
            F: ["Frank", "Fiona", "Felix", "Faith", "Finn", "Francesca", "Frederick", "Felicity"],
            G: ["George", "Grace", "Gabriel", "Gabriella", "Gavin", "Georgia", "Grant", "Giselle"],
            H: ["Henry", "Hannah", "Harry", "Hailey", "Hudson", "Harper", "Hayden", "Hope"],
            I: ["Ian", "Isabella", "Isaac", "Ivy", "Isaiah", "Iris", "Ivan", "Isla"],
            J: ["John", "Julia", "Jack", "Jessica", "Jacob", "Jasmine", "James", "Jennifer"],
            K: ["Kevin", "Katherine", "Kyle", "Kayla", "Kaleb", "Kylie", "Kenneth", "Kiara"],
            L: ["Liam", "Lily", "Lucas", "Lauren", "Logan", "Leah", "Luke", "Lucy"],
            M: ["Mike", "Mary", "Michael", "Megan", "Matthew", "Mia", "Mason", "Madison"],
            N: ["Noah", "Natalie", "Nathan", "Nicole", "Nicholas", "Nora", "Nolan", "Naomi"],
            O: ["Oliver", "Olivia", "Owen", "Ophelia", "Oscar", "Octavia", "Omar", "Odessa"],
            P: ["Peter", "Penelope", "Paul", "Paige", "Patrick", "Piper", "Parker", "Phoebe"],
            Q: ["Quinn", "Quincy", "Quinton", "Queenie", "Quade", "Quiana", "Quent", "Queen"],
            R: ["Ryan", "Rachel", "Robert", "Rebecca", "Richard", "Riley", "Raymond", "Ruby"],
            S: ["Sam", "Sarah", "Steven", "Samantha", "Samuel", "Sophia", "Scott", "Scarlett"],
            T: ["Thomas", "Taylor", "Tyler", "Tessa", "Timothy", "Tara", "Theodore", "Trinity"],
            U: ["Ulysses", "Uma", "Uriah", "Ursula", "Uriel", "Una", "Upton", "Ulani"],
            V: ["Victor", "Victoria", "Vincent", "Vanessa", "Voughn", "Violet", "Vance", "Valerie"],
            W: ["William", "Willow", "Walter", "Wendy", "Wyatt", "Whitney", "Wesley", "Willa"],
            X: ["Xavier", "Xena", "Xander", "Xiomara", "Xeno", "Xylia", "Xerxes", "Xaviera"],
            Y: ["Yusuf", "Yvonne", "Yandel", "Yasmin", "York", "Yara", "Yuri", "Yvette"],
            Z: ["Zachary", "Zoe", "Zane", "Zara", "Zander", "Zelda", "Zion", "Zuri"]
        };

        const userId = "user_01KEN49FM0ERQA2EDDP34699H8";

        for (let i = 0; i < 26; i++) {
            const teamName = phoneticAlphabet[i] ?? `Team ${String.fromCharCode(65 + i)}`;
            const letter = teamName.charAt(0).toUpperCase();
            const availableNames = outputNames[letter] || [];

            // Determine player count
            const playerCount = Math.floor(Math.random() * (maxPlayers - minPlayers + 1)) + minPlayers;

            // Select players
            const teamPlayers: string[] = [];
            for (let j = 0; j < playerCount; j++) {
                if (j < availableNames.length) {
                    teamPlayers.push(availableNames[j]!);
                } else {
                    teamPlayers.push(`${availableNames[j % availableNames.length]} ${Math.floor(j / availableNames.length) + 1}`);
                }
            }

            await ctx.db.insert("tournamentTeams", {
                tournamentTeamId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                tournamentId: args.tournamentId,
                name: teamName,
                playerNames: teamPlayers,
                registeredBy: userId,
                createdAt: Date.now(),
            });
        }
    },
});

