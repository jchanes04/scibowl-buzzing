import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const categoryValidator = v.union(
  v.literal("earth"),
  v.literal("bio"),
  v.literal("chem"),
  v.literal("physics"),
  v.literal("math"),
  v.literal("energy")
);

const scoreTypeValidator = v.union(
  v.literal("correct"),
  v.literal("incorrect"),
  v.literal("penalty")
);

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Query: Get full game data by gameId
 */
export const getByGameId = query({
  args: {
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first();
  },
});

/**
 * Query: Get game by joinCode
 */
export const getByJoinCode = query({
  args: {
    joinCode: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("games")
      .withIndex("by_joinCode", (q) => q.eq("joinCode", args.joinCode))
      .first();
  },
});

/**
 * Query: Get scoreboard data for a game (for client subscription)
 * Returns just scores and pointValues to match existing scoreboard subscription interface
 */
export const getScoreboard = query({
  args: {
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      // Return default empty scoreboard if game not found
      return {
        scores: {},
        pointValues: {
          tossup: 4,
          bonus: 10,
          penalty: -4,
        },
        isActive: true,
      };
    }

    return {
      scores: game.scores,
      pointValues: game.pointValues,
      isActive: game.isActive ?? true,
    };
  },
});

// ============================================================================
// MUTATIONS - Game Lifecycle
// ============================================================================

/**
 * Mutation: Create a new game with config and empty scoreboard
 */
export const create = mutation({
  args: {
    gameId: v.string(),
    joinCode: v.string(),
    name: v.string(),
    settings: v.object({
      individualsAllowed: v.boolean(),
      newTeamsAllowed: v.boolean(),
      spectatorsAllowed: v.boolean(),
    }),
    times: v.object({
      tossup: v.array(v.number()),
      bonus: v.array(v.number()),
      visual: v.array(v.number()),
    }),
    pointValues: v.optional(v.object({
      tossup: v.number(),
      bonus: v.number(),
      penalty: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("games", {
      gameId: args.gameId,
      joinCode: args.joinCode,
      name: args.name,
      settings: args.settings,
      times: args.times,
      scores: {},
      pointValues: args.pointValues ?? {
        tossup: 4,
        bonus: 10,
        penalty: -4,
      },
      createdAt: now,
      lastUpdated: now,
      isActive: true,
    });
  },
});

/**
 * Mutation: Set game active/inactive state
 */
export const setActive = mutation({
  args: {
    gameId: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first();

    if (game) {
      await ctx.db.patch(game._id, {
        isActive: args.isActive,
        lastUpdated: Date.now(),
      });
    }
  },
});

/**
 * Mutation: Delete a game (for cleanup on game end or sweep)
 */
export const deleteGame = mutation({
  args: {
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first();

    if (game) {
      await ctx.db.delete(game._id);
    }
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper: Get game document (throws if not found)
 */
async function getGame(ctx: any, gameId: string) {
  const game = await ctx.db
    .query("games")
    .withIndex("by_gameId", (q: any) => q.eq("gameId", gameId))
    .first();

  if (!game) {
    throw new Error(`Game not found: ${gameId}`);
  }

  return game;
}

/**
 * Helper: Update game scores
 */
async function updateScores(
  ctx: any,
  gameId: string,
  updater: (scores: any) => void
) {
  const game = await getGame(ctx, gameId);
  const scores = { ...game.scores };

  updater(scores);

  await ctx.db.patch(game._id, {
    scores,
    lastUpdated: Date.now(),
  });
}

// ============================================================================
// MUTATIONS - Scoring
// ============================================================================

/**
 * Mutation: Correct tossup
 */
export const correctTossup = mutation({
  args: {
    gameId: v.string(),
    number: v.number(),
    playerId: v.string(),
    teamId: v.string(),
    category: categoryValidator,
  },
  handler: async (ctx, args) => {
    await updateScores(ctx, args.gameId, (scores) => {
      const questionRow = scores[args.number.toString()];
      if (questionRow) {
        questionRow.tossup[args.teamId] = {
          playerId: args.playerId,
          scoreType: "correct",
        };
        questionRow.bonus = null;
      } else {
        scores[args.number.toString()] = {
          category: args.category,
          tossup: {
            [args.teamId]: {
              playerId: args.playerId,
              scoreType: "correct",
            },
          },
          bonus: null,
        };
      }
    });
  },
});

/**
 * Mutation: Incorrect tossup
 */
export const incorrectTossup = mutation({
  args: {
    gameId: v.string(),
    number: v.number(),
    playerId: v.string(),
    teamId: v.string(),
    category: categoryValidator,
  },
  handler: async (ctx, args) => {
    await updateScores(ctx, args.gameId, (scores) => {
      const questionRow = scores[args.number.toString()];
      if (questionRow) {
        questionRow.tossup[args.teamId] = {
          playerId: args.playerId,
          scoreType: "incorrect",
        };
        questionRow.bonus = null;
      } else {
        scores[args.number.toString()] = {
          category: args.category,
          tossup: {
            [args.teamId]: {
              playerId: args.playerId,
              scoreType: "incorrect",
            },
          },
          bonus: null,
        };
      }
    });
  },
});

/**
 * Mutation: Penalty
 */
export const penalty = mutation({
  args: {
    gameId: v.string(),
    number: v.number(),
    playerId: v.string(),
    teamId: v.string(),
    category: categoryValidator,
  },
  handler: async (ctx, args) => {
    await updateScores(ctx, args.gameId, (scores) => {
      const questionRow = scores[args.number.toString()];
      if (questionRow) {
        questionRow.tossup[args.teamId] = {
          playerId: args.playerId,
          scoreType: "penalty",
        };
        questionRow.bonus = null;
      } else {
        scores[args.number.toString()] = {
          category: args.category,
          tossup: {
            [args.teamId]: {
              playerId: args.playerId,
              scoreType: "penalty",
            },
          },
          bonus: null,
        };
      }
    });
  },
});

/**
 * Mutation: Mark question as dead
 */
export const dead = mutation({
  args: {
    gameId: v.string(),
    number: v.number(),
    category: categoryValidator,
  },
  handler: async (ctx, args) => {
    await updateScores(ctx, args.gameId, (scores) => {
      if (!scores[args.number.toString()]) {
        scores[args.number.toString()] = {
          category: args.category,
          tossup: {},
          bonus: null,
        };
      }
    });
  },
});

/**
 * Mutation: Correct bonus
 */
export const correctBonus = mutation({
  args: {
    gameId: v.string(),
    number: v.number(),
    teamId: v.string(),
    category: categoryValidator,
  },
  handler: async (ctx, args) => {
    await updateScores(ctx, args.gameId, (scores) => {
      const questionRow = scores[args.number.toString()];
      if (questionRow) {
        questionRow.bonus = {
          teamId: args.teamId,
          correct: true,
        };
      } else {
        scores[args.number.toString()] = {
          category: args.category,
          tossup: {},
          bonus: {
            teamId: args.teamId,
            correct: true,
          },
        };
      }
    });
  },
});

/**
 * Mutation: Incorrect bonus
 */
export const incorrectBonus = mutation({
  args: {
    gameId: v.string(),
    number: v.number(),
    teamId: v.string(),
    category: categoryValidator,
  },
  handler: async (ctx, args) => {
    await updateScores(ctx, args.gameId, (scores) => {
      const questionRow = scores[args.number.toString()];
      if (questionRow) {
        questionRow.bonus = {
          teamId: args.teamId,
          correct: false,
        };
      } else {
        scores[args.number.toString()] = {
          category: args.category,
          tossup: {},
          bonus: {
            teamId: args.teamId,
            correct: false,
          },
        };
      }
    });
  },
});

/**
 * Mutation: Edit tossup
 */
export const editTossup = mutation({
  args: {
    gameId: v.string(),
    number: v.number(),
    playerId: v.string(),
    teamId: v.string(),
    category: categoryValidator,
    scoreType: v.union(scoreTypeValidator, v.literal("none")),
  },
  handler: async (ctx, args) => {
    await updateScores(ctx, args.gameId, (scores) => {
      const questionRow = scores[args.number.toString()];
      if (questionRow) {
        if (args.scoreType === "none") {
          delete questionRow.tossup[args.teamId];
        } else {
          questionRow.tossup[args.teamId] = {
            playerId: args.playerId,
            scoreType: args.scoreType,
          };
        }
      } else if (args.scoreType !== "none") {
        scores[args.number.toString()] = {
          category: args.category,
          tossup: {
            [args.teamId]: {
              playerId: args.playerId,
              scoreType: args.scoreType,
            },
          },
          bonus: null,
        };
      }
    });
  },
});

/**
 * Mutation: Edit bonus
 */
export const editBonus = mutation({
  args: {
    gameId: v.string(),
    number: v.number(),
    teamId: v.string(),
    scoreType: v.union(v.literal("correct"), v.literal("incorrect"), v.literal("none")),
  },
  handler: async (ctx, args) => {
    await updateScores(ctx, args.gameId, (scores) => {
      const questionRow = scores[args.number.toString()];
      if (questionRow && args.scoreType === "none") {
        questionRow.bonus = null;
      } else if (questionRow) {
        questionRow.bonus = {
          teamId: args.teamId,
          correct: args.scoreType === "correct",
        };
      }
    });
  },
});

/**
 * Mutation: Clear question
 */
export const clearQuestion = mutation({
  args: {
    gameId: v.string(),
    number: v.number(),
  },
  handler: async (ctx, args) => {
    await updateScores(ctx, args.gameId, (scores) => {
      delete scores[args.number.toString()];
    });
  },
});

/**
 * Mutation: Delete question (and renumber)
 */
export const deleteQuestion = mutation({
  args: {
    gameId: v.string(),
    number: v.number(),
  },
  handler: async (ctx, args) => {
    await updateScores(ctx, args.gameId, (scores) => {
      delete scores[args.number.toString()];
      const max = Math.max(...Object.keys(scores).map(Number));
      for (let i = args.number + 1; i <= max; i++) {
        const questionRow = scores[i.toString()];
        if (questionRow) {
          scores[(i - 1).toString()] = questionRow;
          delete scores[i.toString()];
        }
      }
    });
  },
});

/**
 * Mutation: Clear all scores (keeps game config)
 */
export const clearScores = mutation({
  args: {
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await getGame(ctx, args.gameId);
    await ctx.db.patch(game._id, {
      scores: {},
      lastUpdated: Date.now(),
    });
  },
});
