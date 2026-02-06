import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { getGame as getGameHelper, getOrCreateUser, unwrapOrThrow } from "./helpers";
import type { QuestionPairScore, Member, Team } from "./types";

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
  v.literal("penalty"),
  v.literal("subbed")
);

// Members/teams snapshots are passed as v.any() (Record<string, CachedMember/CachedTeam>)

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
 * Query: Get all games for a tournament
 */
export const getByTournamentId = query({
  args: {
    tournamentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("games")
      .withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId))
      .collect();
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
        members: {},
        teams: {},
      };
    }

    return {
      scores: game.scores,
      pointValues: game.pointValues,
      isActive: game.isActive ?? true,
      members: game.members || {},
      teams: game.teams ?? {},
    };
  },
});

// ============================================================================
// MUTATIONS - Game Lifecycle
// ============================================================================

/**
 * Normalize a tag: lowercase, spaces to dashes, alphanumeric only
 */
function normalizeTag(tag: string): string | null {
  let normalized = tag.trim().toLowerCase().replace(/\s+/g, "-");
  normalized = normalized.replace(/[^a-z0-9-]/g, "");
  normalized = normalized.replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (normalized.length === 0) return null;
  if (normalized.length > 50) normalized = normalized.substring(0, 50);
  return normalized;
}

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
    tags: v.optional(v.array(v.string())),
    // Tournament link (optional)
    tournamentId: v.optional(v.string()),
    tournamentMatchIndex: v.optional(v.number()),
    moderatorJoinCode: v.optional(v.string()),
    // Socket-authoritative member/team state
    members: v.optional(v.any()),
    teams: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Normalize tags if provided
    const normalizedTags = args.tags
      ? [...new Set(args.tags.map(normalizeTag).filter((t): t is string => t !== null))]
      : [];

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
      tags: normalizedTags,
      createdAt: now,
      lastUpdated: now,
      isActive: true,
      tournamentId: args.tournamentId,
      tournamentMatchIndex: args.tournamentMatchIndex,
      moderatorJoinCode: args.moderatorJoinCode,
      members: args.members,
      teams: args.teams,
    });
  },
});

/**
 * Mutation: Set game active/inactive state (whether game is in memory)
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
 * Mutation: Set game completed state (whether game has ended via endGame)
 */
export const setCompleted = mutation({
  args: {
    gameId: v.string(),
    isCompleted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first();

    if (game) {
      await ctx.db.patch(game._id, {
        isCompleted: args.isCompleted,
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
async function getGame(ctx: MutationCtx, gameId: string) {
  return unwrapOrThrow(await getGameHelper(ctx, gameId));
}

/**
 * Helper: Update game scores and persist members/teams snapshots
 */
async function updateScores(
  ctx: MutationCtx,
  gameId: string,
  updater: (scores: Record<string, QuestionPairScore>) => void,
  members?: Record<string, Member>,
  teams?: Record<string, Team>
) {
  const game = await getGame(ctx, gameId);
  const scores = { ...game.scores } as Record<string, QuestionPairScore>;

  updater(scores);

  const patchData: {
    scores: Record<string, QuestionPairScore>;
    lastUpdated: number;
    members?: Record<string, Member>;
    teams?: Record<string, Team>;
  } = {
    scores,
    lastUpdated: Date.now(),
  };

  // Persist members/teams snapshots
  if (members && Object.keys(members).length > 0) {
    patchData.members = members;
  }

  if (teams && Object.keys(teams).length > 0) {
    patchData.teams = teams;
  }

  await ctx.db.patch(game._id, patchData);
}

/**
 * Mutation: Track a game join by adding the gameId to the user's gameIds array.
 * Called when a member joins a game (not deferred to persistMemberState).
 */
export const trackGameJoin = mutation({
  args: {
    gameId: v.string(),
    memberId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx, args.memberId);
    const gameIds = user.gameIds ?? [];
    if (!gameIds.includes(args.gameId)) {
      await ctx.db.patch(user._id, {
        gameIds: [...gameIds, args.gameId],
      });
    }
  },
});

/**
 * Mutation: Persist member/team state from socket server to game object
 */
export const persistMemberState = mutation({
  args: {
    gameId: v.string(),
    members: v.any(), // Record<string, CachedMember>
    teams: v.any(), // Record<string, CachedTeam>
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) return;

    await ctx.db.patch(game._id, {
      members: args.members,
      teams: args.teams,
      lastUpdated: Date.now(),
    });
  },
});

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
    members: v.optional(v.any()),
    teams: v.optional(v.any()),
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
    }, args.members, args.teams);
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
    members: v.optional(v.any()),
    teams: v.optional(v.any()),
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
    }, args.members, args.teams);
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
    members: v.optional(v.any()),
    teams: v.optional(v.any()),
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
    }, args.members, args.teams);
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
    members: v.optional(v.any()),
    teams: v.optional(v.any()),
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
    }, args.members, args.teams);
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
    members: v.optional(v.any()),
    teams: v.optional(v.any()),
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
    }, args.members, args.teams);
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
    members: v.optional(v.any()),
    teams: v.optional(v.any()),
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
    }, args.members, args.teams);
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
    scoreType: v.union(scoreTypeValidator, v.literal("none"))
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
 * Mutation: Backfill subbed scores for a late-joining player
 * Efficiently updates all prior questions in a single database operation
 */
export const backfillSubbedScores = mutation({
  args: {
    gameId: v.string(),
    playerId: v.string(),
    playerName: v.string(),
    teamId: v.string(),
    teamName: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await getGame(ctx, args.gameId);
    const scores = { ...game.scores };

    // Add subbed score for each question where this team doesn't have a score
    for (const [qNumStr, questionData] of Object.entries(scores)) {
      const row = questionData as QuestionPairScore;
      if (row && !row.tossup[args.teamId]) {
        row.tossup[args.teamId] = {
          playerId: args.playerId,
          scoreType: "subbed",
        };
      }
    }

    await ctx.db.patch(game._id, {
      scores,
      lastUpdated: Date.now(),
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
