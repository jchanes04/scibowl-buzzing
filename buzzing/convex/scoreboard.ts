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
 * Query: Get scoreboard for a game
 */
export const getForGame = query({
  args: {
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    const scoreboard = await ctx.db
      .query("scoreboard")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!scoreboard) {
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
      scores: scoreboard.scores,
      pointValues: scoreboard.pointValues,
    };
  },
});

/**
 * Helper: Get or create scoreboard document for a game
 */
async function getOrCreateScoreboard(ctx: any, gameId: string) {
  let scoreboard = await ctx.db
    .query("scoreboard")
    .withIndex("by_gameId", (q: any) => q.eq("gameId", gameId))
    .first();

  if (!scoreboard) {
    const scoreboardId = await ctx.db.insert("scoreboard", {
      gameId,
      scores: {},
      pointValues: {
        tossup: 4,
        bonus: 10,
        penalty: -4,
      },
      lastUpdated: Date.now(),
    });
    scoreboard = await ctx.db.get(scoreboardId);
  }

  return scoreboard!;
}

/**
 * Helper: Update scoreboard (internal helper)
 */
async function updateScoreboard(
  ctx: any,
  gameId: string,
  updater: (scores: any, pointValues: any) => void
) {
  const scoreboard = await getOrCreateScoreboard(ctx, gameId);
  const scores = { ...scoreboard.scores };
  const pointValues = { ...scoreboard.pointValues };

  updater(scores, pointValues);

  await ctx.db.patch(scoreboard._id, {
    scores,
    pointValues,
    lastUpdated: Date.now(),
  });
}

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
