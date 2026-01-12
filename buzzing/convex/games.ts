import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { GameScoreboard } from "$lib/classes/GameScoreboard";
import type { Category, ScoreType } from "$lib/classes/Game";


export const getUserGames = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        // Get all games where user was a player
        const playerGames = await ctx.db.query("players")
            .withIndex("by_externalId", q => q.eq("externalId", args.userId))
            .collect();

        // Get all games where user was a moderator
        const moderatorGames = await ctx.db.query("moderators")
            .withIndex("by_externalId", q => q.eq("externalId", args.userId))
            .collect();

        // Get unique game IDs
        const gameIds = new Set([
            ...playerGames.map(p => p.gameId),
            ...moderatorGames.map(m => m.gameId)
        ]);

        // Fetch full game details
        const games = [];
        for (const gameId of gameIds) {
            const game = await ctx.db.get(gameId);
            if (game) {
                // Get player's role in this game
                const playerRecord = playerGames.find(p => p.gameId === gameId);
                const moderatorRecord = moderatorGames.find(m => m.gameId === gameId);

                games.push({
                    ...game,
                    userRole: playerRecord ? 'player' : 'moderator',
                    userActive: playerRecord ? playerRecord.connected : moderatorRecord?.connected,
                });
            }
        }

        // Sort by last active, most recent first
        return games.sort((a, b) => b.lastActive - a.lastActive);
    },
});

// Create a new game
export const create = mutation({
    args: {
        joinCode: v.string(),
        name: v.string(),
        ownerId: v.string(),
        ownerName: v.string(), // To create the owner moderator record
        settings: v.object({
            individualsAllowed: v.boolean(),
            newTeamsAllowed: v.boolean(),
            spectatorsAllowed: v.boolean()
        }),
        times: v.object({
            tossup: v.array(v.float64()),
            bonus: v.array(v.float64()),
            visual: v.array(v.float64())
        }),
        scoreboard: v.string(),
        teams: v.array(v.object({
            id: v.string(),
            name: v.string(),
            type: v.union(v.literal("default"), v.literal("created"), v.literal("individual"))
        })), // Initial teams if any (e.g. from template)
    },
    handler: async (ctx, args) => {
        const gameId = await ctx.db.insert("games", {
            joinCode: args.joinCode,
            name: args.name,
            ownerId: args.ownerId,
            settings: args.settings,
            times: args.times,
            lastActive: Date.now(),
            scoreboard: args.scoreboard
        });

        // Create owner moderator
        await ctx.db.insert("moderators", {
            gameId,
            externalId: args.ownerId,
            name: args.ownerName,
            connected: true,
        });

        // Create initial teams
        for (const team of args.teams) {
            await ctx.db.insert("teams", {
                gameId,
                externalId: team.id,
                name: team.name,
                type: team.type
            });
        }

        return gameId;
    },
});

export const getFullGame = query({
    args: { gameId: v.id("games") },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game) return null;
        // Filter out inactive players/mods?
        const players = await ctx.db.query("players").withIndex("by_gameId", q => q.eq("gameId", args.gameId)).collect();
        const teams = await ctx.db.query("teams").withIndex("by_gameId", q => q.eq("gameId", args.gameId)).collect();
        const moderators = await ctx.db.query("moderators").withIndex("by_gameId", q => q.eq("gameId", args.gameId)).collect();

        return { game, players, teams, moderators };
    }
});

export const getGameById = query({
    args: { gameId: v.id("games") },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game) return null;
        return game;
    }
});

export const getByJoinCode = query({

    args: { joinCode: v.string() },
    handler: async (ctx, args) => {
        const game = await ctx.db.query("games")
            .withIndex("by_joinCode", q => q.eq("joinCode", args.joinCode))
            .first();
        if (!game) return null;
        return game;
    }
});

// Generic updater for scoreboard
export const updateScoreboard = mutation({
    args: { gameId: v.id("games"), scoreboard: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.gameId, { scoreboard: args.scoreboard, lastActive: Date.now() });
    }
});

function getScoreboard(scoreboardStr: string) {
    const scores = JSON.parse(scoreboardStr);
    return new GameScoreboard(scores);
}

export const scoreTossup = mutation({
    args: {
        gameId: v.id("games"),
        number: v.float64(),
        playerId: v.string(),
        teamId: v.string(),
        category: v.string(), // Cast to Category
        scoreType: v.string() // Cast to ScoreType
    },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game) return;

        const sb = getScoreboard(game.scoreboard);
        const scoreType = args.scoreType as ScoreType;
        const category = args.category as Category;

        if (scoreType === "correct") {
            sb.correctTossup(args.number, args.playerId, args.teamId, category);
        } else if (scoreType === "incorrect") {
            sb.incorrectTossup(args.number, args.playerId, args.teamId, category);
        } else if (scoreType === "penalty") {
            sb.penalty(args.number, args.playerId, args.teamId, category);
        }

        await ctx.db.patch(args.gameId, { scoreboard: JSON.stringify(sb.scores), lastActive: Date.now() });
    }
});

export const scoreBonus = mutation({
    args: {
        gameId: v.id("games"),
        number: v.float64(),
        teamId: v.string(),
        category: v.string(),
        scoreType: v.string() // correct/incorrect
    },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game) return;

        const sb = getScoreboard(game.scoreboard);
        const category = args.category as Category;

        if (args.scoreType === "correct") {
            sb.correctBonus(args.number, args.teamId, category);
        } else {
            sb.incorrectBonus(args.number, args.teamId, category);
        }

        await ctx.db.patch(args.gameId, { scoreboard: JSON.stringify(sb.scores), lastActive: Date.now() });
    }
});

export const deadQuestion = mutation({
    args: {
        gameId: v.id("games"),
        number: v.float64(),
        category: v.string()
    },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game) return;
        const sb = getScoreboard(game.scoreboard);
        sb.dead(args.number, args.category as Category);
        await ctx.db.patch(args.gameId, { scoreboard: JSON.stringify(sb.scores), lastActive: Date.now() });
    }
});

export const editTossup = mutation({
    args: {
        gameId: v.id("games"),
        number: v.float64(),
        playerId: v.string(),
        teamId: v.string(),
        category: v.string(),
        scoreType: v.string() // ScoreType | "none"
    },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game) return;
        const sb = getScoreboard(game.scoreboard);
        sb.editTossup(args.number, args.playerId, args.teamId, args.category as Category, args.scoreType as ScoreType | "none");
        await ctx.db.patch(args.gameId, { scoreboard: JSON.stringify(sb.scores), lastActive: Date.now() });
    }
});

export const editBonus = mutation({
    args: {
        gameId: v.id("games"),
        number: v.float64(),
        teamId: v.string(),
        scoreType: v.string() // "correct" | "incorrect" | "none"
    },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game) return;
        const sb = getScoreboard(game.scoreboard);
        sb.editBonus(args.number, args.teamId, args.scoreType as "correct" | "incorrect" | "none");
        await ctx.db.patch(args.gameId, { scoreboard: JSON.stringify(sb.scores), lastActive: Date.now() });
    }
});

export const deleteQuestion = mutation({
    args: {
        gameId: v.id("games"),
        number: v.float64(),
    },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game) return;
        const sb = getScoreboard(game.scoreboard);
        sb.deleteQuestion(args.number);
        await ctx.db.patch(args.gameId, { scoreboard: JSON.stringify(sb.scores), lastActive: Date.now() });
    }
});

export const clearScores = mutation({
    args: { gameId: v.id("games") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.gameId, { scoreboard: "{}", lastActive: Date.now() });
    }
});

// Player management
export const addPlayer = mutation({
    args: {
        gameId: v.id("games"),
        externalId: v.string(),
        name: v.string(),
        teamId: v.optional(v.string()),
        isCaptain: v.optional(v.boolean()),
        connected: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        // Check if player exists (maybe inactive?)
        // Query by both gameId and externalId using a compound index (assumes "by_gameId_externalId" exists)
        const existing = await ctx.db.query("players")
            .withIndex("by_gameId_externalId", (q) =>
                q.eq("gameId", args.gameId).eq("externalId", args.externalId),
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                connected: args.connected ?? true,
                name: args.name,
                teamId: args.teamId,
                isCaptain: args.isCaptain
            });
        } else {
            await ctx.db.insert("players", {
                gameId: args.gameId,
                externalId: args.externalId,
                name: args.name,
                teamId: args.teamId,
                isCaptain: args.isCaptain,
                connected: args.connected ?? true
            });
        }
        await ctx.db.patch(args.gameId, { lastActive: Date.now() });
    }
});

export const disconnectPlayer = mutation({
    args: { externalId: v.string(), gameId: v.id("games") },
    handler: async (ctx, args) => {
        const player = await ctx.db.query("players")
            .withIndex("by_gameId_externalId", q => q.eq("gameId", args.gameId).eq("externalId", args.externalId))
            .first();
        if (player) {
            await ctx.db.patch(player._id, { connected: false });
        }
    }
});

export const kickPlayer = mutation({
    args: { externalId: v.string(), gameId: v.id("games") },
    handler: async (ctx, args) => {
        const player = await ctx.db.query("players")
            .withIndex("by_gameId_externalId", q => q.eq("gameId", args.gameId).eq("externalId", args.externalId))
            .first();
        if (player) {
            await ctx.db.delete(player._id);
        }
    }
});

export const updatePlayerTeam = mutation({
    args: { externalId: v.string(), teamId: v.string() },
    handler: async (ctx, args) => {
        const player = await ctx.db.query("players")
            .withIndex("by_externalId", q => q.eq("externalId", args.externalId))
            .first();
        if (player) {
            await ctx.db.patch(player._id, { teamId: args.teamId });
        }
    }
});


// Team management
export const addTeam = mutation({
    args: {
        gameId: v.id("games"),
        externalId: v.string(),
        name: v.string(),
        type: v.union(v.literal("default"), v.literal("created"), v.literal("individual"))
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("teams")
            .withIndex("by_externalId", q => q.eq("externalId", args.externalId))
            .first();
        if (!existing) {
            await ctx.db.insert("teams", {
                gameId: args.gameId,
                externalId: args.externalId,
                name: args.name,
                type: args.type
            });
        }
        await ctx.db.patch(args.gameId, { lastActive: Date.now() });
    }
});

export const removeTeam = mutation({
    args: { externalId: v.string() },
    handler: async (ctx, args) => {
        const team = await ctx.db.query("teams")
            .withIndex("by_externalId", q => q.eq("externalId", args.externalId))
            .first();
        if (team) {
            await ctx.db.delete(team._id);
        }
    }
});

// Moderator management
export const addModerator = mutation({
    args: {
        gameId: v.id("games"),
        externalId: v.string(),
        name: v.string(),
        connected: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("moderators")
            .withIndex("by_gameId_externalId", (q) =>
                q.eq("gameId", args.gameId).eq("externalId", args.externalId),
            ).first();
        if (existing) {
            await ctx.db.patch(existing._id, { connected: args.connected ?? true, name: args.name });
        } else {
            await ctx.db.insert("moderators", {
                gameId: args.gameId,
                externalId: args.externalId,
                name: args.name,
                connected: args.connected ?? true
            });
        }
        await ctx.db.patch(args.gameId, { lastActive: Date.now() });
    }
});

export const disconnectModerator = mutation({
    args: { externalId: v.string(), gameId: v.id("games") },
    handler: async (ctx, args) => {
        const mod = await ctx.db.query("moderators")
            .withIndex("by_gameId_externalId", q => q.eq("gameId", args.gameId).eq("externalId", args.externalId))
            .first();
        console.log("Removing moderator", mod);
        if (mod) {
            await ctx.db.patch(mod._id, { connected: false });
        }
    }
});

// =====================
// Question Timer mutations
// =====================

export const startQuestionTimer = mutation({
    args: { gameId: v.id("games"), duration: v.number() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.gameId, {
            questionTimer: {
                startedAt: Date.now(),
                duration: args.duration,
            },
            lastActive: Date.now()
        });
    }
});

export const pauseQuestionTimer = mutation({
    args: { gameId: v.id("games") },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game?.questionTimer) return;

        // Only pause if not already paused
        if (!game.questionTimer.pausedAt) {
            await ctx.db.patch(args.gameId, {
                questionTimer: {
                    ...game.questionTimer,
                    pausedAt: Date.now(),
                },
                lastActive: Date.now()
            });
        }
    }
});

export const resumeQuestionTimer = mutation({
    args: { gameId: v.id("games") },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game?.questionTimer?.pausedAt) return;

        // Calculate how long it was paused and adjust startedAt
        const pauseDuration = Date.now() - game.questionTimer.pausedAt;
        await ctx.db.patch(args.gameId, {
            questionTimer: {
                startedAt: game.questionTimer.startedAt + pauseDuration,
                duration: game.questionTimer.duration,
                // Remove pausedAt by not including it
            },
            lastActive: Date.now()
        });
    }
});

export const stopQuestionTimer = mutation({
    args: { gameId: v.id("games") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.gameId, {
            questionTimer: undefined,
            lastActive: Date.now()
        });
    }
});

// =====================
// Game Clock mutations
// =====================

export const startGameClock = mutation({
    args: { gameId: v.id("games"), duration: v.number() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.gameId, {
            gameClock: {
                startedAt: Date.now(),
                duration: args.duration,
            },
            lastActive: Date.now()
        });
    }
});

export const pauseGameClock = mutation({
    args: { gameId: v.id("games") },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game?.gameClock) return;

        // Only pause if not already paused
        if (!game.gameClock.pausedAt) {
            await ctx.db.patch(args.gameId, {
                gameClock: {
                    ...game.gameClock,
                    pausedAt: Date.now(),
                },
                lastActive: Date.now()
            });
        }
    }
});

export const resumeGameClock = mutation({
    args: { gameId: v.id("games") },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game?.gameClock?.pausedAt) return;

        // Calculate how long it was paused and adjust startedAt
        const pauseDuration = Date.now() - game.gameClock.pausedAt;
        await ctx.db.patch(args.gameId, {
            gameClock: {
                startedAt: game.gameClock.startedAt + pauseDuration,
                duration: game.gameClock.duration,
                // Remove pausedAt and ended by not including them
            },
            lastActive: Date.now()
        });
    }
});

export const stopGameClock = mutation({
    args: { gameId: v.id("games") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.gameId, {
            gameClock: undefined,
            lastActive: Date.now()
        });
    }
});

export const endGameClock = mutation({
    args: { gameId: v.id("games") },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game?.gameClock) return;

        await ctx.db.patch(args.gameId, {
            gameClock: {
                ...game.gameClock,
                ended: true,
            },
            lastActive: Date.now()
        });
    }
});
