import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getOrCreateUser } from "./helpers";
import type { Member, QuestionPairScore, TossupScore } from "./types";

/**
 * Get all games a member has participated in (for game history)
 * Uses the gameIds array on the users table
 */
export const getByMemberId = query({
  args: {
    memberId: v.string(),
  },
  handler: async (ctx, args) => {
    // Look up user to get their gameIds
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.memberId))
      .first();

    const gameIds = (user?.gameIds ?? []) as string[];
    if (gameIds.length === 0) {
      return [];
    }

    // Batch-fetch all games
    const games = await Promise.all(
      gameIds.map(async (gameId) => {
        const game = await ctx.db
          .query("games")
          .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
          .first();

        if (!game) return null;

        // Derive memberType and memberName from the persisted members snapshot
        const members = (game.members ?? {}) as Record<string, Member>;
        const memberData = members[args.memberId];
        const memberType = memberData?.type ?? "player";
        const memberName = memberData?.name ?? "Unknown";

        return {
          gameId: game.gameId,
          name: game.name,
          createdAt: game.createdAt,
          isActive: game.isActive ?? false,
          memberType,
          memberName,
          members: game.members ?? {},
          teams: game.teams ?? {},
          scores: game.scores ?? {},
          pointValues: game.pointValues ?? {
            tossup: 4,
            bonus: 10,
            penalty: -4,
          },
          tags: game.tags ?? [],
        };
      })
    );

    // Filter out null entries and sort by createdAt descending
    return games
      .filter((g): g is NonNullable<typeof g> => g !== null)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Migrate all game history from one memberId to another
 * Used when an anonymous user logs in and wants to link their account
 */
export const migrateMemberId = mutation({
  args: {
    oldMemberId: v.string(),
    newMemberId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get or create both user documents
    const oldUser = await getOrCreateUser(ctx, args.oldMemberId);
    const newUser = await getOrCreateUser(ctx, args.newMemberId);

    const oldGameIds = (oldUser.gameIds ?? []) as string[];
    const newGameIds = (newUser.gameIds ?? []) as string[];
    const oldPrivateTags = (oldUser.privateTags ?? {}) as Record<string, string[]>;
    const newPrivateTags = (newUser.privateTags ?? {}) as Record<string, string[]>;

    // Merge gameIds (deduplicated)
    const mergedGameIds = [...new Set([...newGameIds, ...oldGameIds])];

    // Merge privateTags
    for (const [tag, tagGameIds] of Object.entries(oldPrivateTags)) {
      if (!newPrivateTags[tag]) {
        newPrivateTags[tag] = [];
      }
      for (const gid of tagGameIds) {
        if (!newPrivateTags[tag].includes(gid)) {
          newPrivateTags[tag].push(gid);
        }
      }
    }

    // Update new user with merged data
    await ctx.db.patch(newUser._id, {
      gameIds: mergedGameIds,
      privateTags: newPrivateTags,
    });

    // Clear old user's data (keep doc)
    await ctx.db.patch(oldUser._id, {
      gameIds: [],
      privateTags: {},
    });

    // Update scoreboard data and members keys in affected games
    let migratedCount = 0;
    for (const gameId of oldGameIds) {
      const game = await ctx.db
        .query("games")
        .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
        .first();

      if (!game) continue;

      let updated = false;
      const patchData: { members?: Record<string, Member>; scores?: Record<string, QuestionPairScore> } = {};

      // Migrate members key
      const members = { ...(game.members ?? {}) } as Record<string, Member>;
      if (args.oldMemberId in members) {
        members[args.newMemberId] = members[args.oldMemberId]!;
        delete members[args.oldMemberId];
        patchData.members = members;
        updated = true;
      }

      // Migrate playerId references in scores
      const scores = { ...game.scores } as Record<string, QuestionPairScore>;
      for (const [, questionData] of Object.entries(scores)) {
        const qData = questionData as QuestionPairScore;
        if (qData.tossup) {
          for (const [teamId, tossupData] of Object.entries(qData.tossup)) {
            const td = tossupData as TossupScore;
            if (td.playerId === args.oldMemberId) {
              qData.tossup[teamId] = {
                ...td,
                playerId: args.newMemberId,
              };
              patchData.scores = scores;
              updated = true;
            }
          }
        }
      }

      if (updated) {
        await ctx.db.patch(game._id, patchData);
        migratedCount++;
      }
    }

    return { migratedCount };
  },
});
