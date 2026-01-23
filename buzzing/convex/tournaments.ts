import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { createGameID, createJoinCode } from "$lib/functions/createId";
import {
    generateBracket,
    isByeMatch,
    getWinnersColumnForRound,
    getLosersColumnForRound,
    getMatchLetterSuffix,
    type BracketMatch,
    type MatchBracket,
} from "$lib/functions/bracketGeneration";

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

/**
 * Query: Get all teams registered by a specific user for a tournament
 */
export const getTeamsByUser = query({
    args: {
        tournamentId: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const teams = await ctx.db
            .query("tournamentTeams")
            .withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId))
            .collect();

        // Filter by registeredBy
        const userTeams = teams.filter(t => t.registeredBy === args.userId);

        return userTeams.map(t => ({
            teamId: t.tournamentTeamId,
            name: t.name,
            players: t.playerNames || [],
            registeredBy: t.registeredBy,
        }));
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
 * Mutation: Update an existing team registration
 * Only the user who registered the team can update it
 */
export const updateTeam = mutation({
    args: {
        teamId: v.string(),
        name: v.string(),
        players: v.array(v.string()),
        userId: v.string(), // The user attempting to update
    },
    handler: async (ctx, args) => {
        // Find the team
        const team = await ctx.db
            .query("tournamentTeams")
            .withIndex("by_tournamentTeamId", (q) => q.eq("tournamentTeamId", args.teamId))
            .first();

        if (!team) {
            throw new Error("Team not found");
        }

        // Verify the user is the one who registered the team
        if (team.registeredBy !== args.userId) {
            throw new Error("You can only edit teams you registered");
        }

        // Get tournament settings for validation
        const tournament = await ctx.db
            .query("tournaments")
            .withIndex("by_tournamentId", (q) => q.eq("tournamentId", team.tournamentId))
            .first();

        if (!tournament) {
            throw new Error("Tournament not found");
        }

        // Check if bracket is confirmed (no edits allowed after confirmation)
        if (tournament.bracketConfirmed) {
            throw new Error("Cannot edit teams after the bracket has been confirmed");
        }

        // Validate player count
        const minPlayers = tournament.settings?.minPlayers ?? 1;
        const maxPlayers = tournament.settings?.maxPlayers ?? 10;
        if (args.players.length < minPlayers) {
            throw new Error(`Team must have at least ${minPlayers} players`);
        }
        if (args.players.length > maxPlayers) {
            throw new Error(`Team cannot have more than ${maxPlayers} players`);
        }

        // Update the team
        await ctx.db.patch(team._id, {
            name: args.name,
            playerNames: args.players,
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

// Bracket generation functions are imported from $lib/functions/bracketGeneration


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

        const bracketType = (tournament.bracketType || "single") as "single" | "double";

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

        // Generate bracket using unified function
        const bracket = generateBracket({
            bracketSize,
            bracketType,
            grandFinalReset,
        });

        const gameIds: string[] = [];
        const now = Date.now();

        // Helper to get non-bye matches by bracket section and round
        const getMatchesByRound = (matches: BracketMatch[], round: number) =>
            matches.filter(m => m.round === round && !isByeMatch(m));

        // Process all bracket sections with unified logic
        const sections: { matches: BracketMatch[]; bracketName: MatchBracket }[] = [
            { matches: bracket.winners, bracketName: "winners" },
            { matches: bracket.losers, bracketName: "losers" },
            { matches: bracket.grandFinal, bracketName: "grand_final" },
        ];

        for (const { matches, bracketName } of sections) {
            if (matches.length === 0) continue;

            const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);
            const displayRounds = rounds.filter(round =>
                matches.some(m => m.round === round && !isByeMatch(m))
            );

            for (const match of matches) {
                // Skip bye matches
                if (isByeMatch(match)) continue;

                const gameId = createGameID();
                const joinCode = createJoinCode();
                const moderatorJoinCode = createJoinCode();

                // Determine match name based on bracket type and section
                const matchesInRound = getMatchesByRound(matches, match.round);
                const matchIdxInRound = matchesInRound.findIndex(m => m.matchIndex === match.matchIndex);
                const displayRoundIdx = displayRounds.indexOf(match.round);

                let matchName: string;

                if (bracketType === "double") {
                    // Double elimination naming
                    if (bracketName === "grand_final") {
                        matchName = match.matchIndex === 0 ? "GF" : "GF Reset";
                    } else if (bracketName === "winners") {
                        const col = getWinnersColumnForRound(match.round);
                        if (match.round === rounds[rounds.length - 1]) {
                            matchName = `DE${col}-WF`;
                        } else {
                            matchName = `DE${col}-W${getMatchLetterSuffix(matchIdxInRound)}`;
                        }
                    } else {
                        // Losers bracket
                        const col = getLosersColumnForRound(match.round);
                        if (match.round === rounds[rounds.length - 1]) {
                            matchName = `DE${col}-LF`;
                        } else {
                            matchName = `DE${col}-L${getMatchLetterSuffix(matchIdxInRound)}`;
                        }
                    }
                } else {
                    // Single elimination naming
                    if (displayRoundIdx === displayRounds.length - 1) {
                        matchName = "Final";
                    } else {
                        matchName = `SE${displayRoundIdx + 1}-${getMatchLetterSuffix(matchIdxInRound)}`;
                    }
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
                    tournamentMatchBracket: bracketName,
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

