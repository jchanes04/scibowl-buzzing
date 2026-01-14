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

/**
 * Query: Get game by gameId
 */
export const get = query({
  args: {
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first();

    return game;
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
    const game = await ctx.db
      .query("games")
      .withIndex("by_joinCode", (q) => q.eq("joinCode", args.joinCode))
      .first();

    return game;
  },
});

/**
 * Query: Get scoreboard for a game (backward compatibility)
 */
export const getForGame = query({
  args: {
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      // Return default empty scoreboard
      return {
        scores: {},
        pointValues: {
          tossup: 4,
          bonus: 10,
          penalty: -4,
        },
      };
    }

    return {
      scores: game.scoreboard.scores,
      pointValues: game.scoreboard.pointValues,
    };
  },
});

/**
 * Mutation: Create a new game
 */
export const createGame = mutation({
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
    pointValues: v.optional(
      v.object({
        tossup: v.number(),
        bonus: v.number(),
        penalty: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const gameId = await ctx.db.insert("games", {
      gameId: args.gameId,
      joinCode: args.joinCode,
      name: args.name,
      settings: args.settings,
      times: args.times,
      scoreboard: {
        pointValues: args.pointValues ?? {
          tossup: 4,
          bonus: 10,
          penalty: -4,
        },
        scores: {},
      },
      createdAt: now,
      lastActive: now,
    });

    return gameId;
  },
});

/**
 * Mutation: Update lastActive timestamp
 */
export const updateLastActive = mutation({
  args: {
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first();

    if (game) {
      await ctx.db.patch(game._id, {
        lastActive: Date.now(),
      });
    }
  },
});

/**
 * Mutation: Start question timer
 */
export const startTimer = mutation({
  args: {
    gameId: v.string(),
    startTime: v.number(),
    duration: v.number(),
    timerType: v.union(v.literal("tossup"), v.literal("bonus"), v.literal("visual")),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first();

    if (game) {
      await ctx.db.patch(game._id, {
        questionTimerStartTime: args.startTime,
        questionTimerDuration: args.duration,
        questionTimerType: args.timerType,
      });
    }
  },
});

/**
 * Mutation: End question timer
 */
export const endTimer = mutation({
  args: {
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first();

    if (game) {
      await ctx.db.patch(game._id, {
        questionTimerStartTime: undefined,
        questionTimerDuration: undefined,
        questionTimerType: undefined,
      });
    }
  },
});

/**
 * Mutation: Start game clock
 */
export const startGameClock = mutation({
  args: {
    gameId: v.string(),
    startTime: v.number(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first();

    if (game) {
      await ctx.db.patch(game._id, {
        gameClockStartTime: args.startTime,
        gameClockDuration: args.duration,
      });
    }
  },
});

/**
 * Mutation: End game clock
 */
export const endGameClock = mutation({
  args: {
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first();

    if (game) {
      await ctx.db.patch(game._id, {
        gameClockStartTime: undefined,
        gameClockDuration: undefined,
      });
    }
  },
});

/**
 * Helper: Get or create game document (for scoreboard operations)
 */
async function getGame(ctx: any, gameId: string) {
  const game = await ctx.db
    .query("games")
    .withIndex("by_gameId", (q: any) => q.eq("gameId", gameId))
    .first();

  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  return game;
}

/**
 * Helper: Update scoreboard (internal helper)
 */
async function updateScoreboard(
  ctx: any,
  gameId: string,
  updater: (scores: any, pointValues: any) => void
) {
  const game = await getGame(ctx, gameId);
  const scoreboard = { ...game.scoreboard };
  const scores = { ...scoreboard.scores };
  const pointValues = { ...scoreboard.pointValues };

  updater(scores, pointValues);

  await ctx.db.patch(game._id, {
    scoreboard: {
      scores,
      pointValues,
    },
  });
}

// ============================================================================
// SCOREBOARD MUTATIONS (migrated from scoreboard.ts)
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
    await updateScoreboard(ctx, args.gameId, (scores, _pointValues) => {
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
    await updateScoreboard(ctx, args.gameId, (scores, _pointValues) => {
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
    await updateScoreboard(ctx, args.gameId, (scores, _pointValues) => {
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
    await updateScoreboard(ctx, args.gameId, (scores, _pointValues) => {
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
    await updateScoreboard(ctx, args.gameId, (scores, _pointValues) => {
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
    await updateScoreboard(ctx, args.gameId, (scores, _pointValues) => {
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
    await updateScoreboard(ctx, args.gameId, (scores, _pointValues) => {
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
    await updateScoreboard(ctx, args.gameId, (scores, _pointValues) => {
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
    await updateScoreboard(ctx, args.gameId, (scores, _pointValues) => {
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
    await updateScoreboard(ctx, args.gameId, (scores, _pointValues) => {
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
 * Mutation: Clear all scores
 */
export const clear = mutation({
  args: {
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    await updateScoreboard(ctx, args.gameId, (scores, _pointValues) => {
      // Clear all scores
      Object.keys(scores).forEach((key) => delete scores[key]);
    });
  },
});
