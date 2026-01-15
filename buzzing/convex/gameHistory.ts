import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get all games a member has participated in (for game history)
 */
export const getByMemberId = query({
  args: {
    memberId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find all game memberships for this member
    const memberships = await ctx.db
      .query("gameMembers")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
      .collect();

    // Get unique game IDs
    const gameIds = [...new Set(memberships.map((m) => m.gameId))];

    // Fetch game details for each
    const games = await Promise.all(
      gameIds.map(async (gameId) => {
        const game = await ctx.db
          .query("games")
          .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
          .first();

        if (!game) return null;

        // Find the member's role in this game
        const membership = memberships.find((m) => m.gameId === gameId);

        return {
          gameId: game.gameId,
          name: game.name,
          createdAt: game.createdAt,
          isActive: game.isActive ?? false,
          memberType: membership?.type ?? "player",
          memberName: membership?.name ?? "",
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
 * Migrate all game memberships from one memberId to another
 * Used when an anonymous user logs in and wants to link their account
 */
export const migrateMemberId = mutation({
  args: {
    oldMemberId: v.string(),
    newMemberId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find all memberships with the old memberId
    const oldMemberships = await ctx.db
      .query("gameMembers")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.oldMemberId))
      .collect();

    let migratedCount = 0;

    for (const membership of oldMemberships) {
      // Check if the new memberId already has a membership in this game
      const existingNewMembership = await ctx.db
        .query("gameMembers")
        .withIndex("by_gameId_memberId", (q) =>
          q.eq("gameId", membership.gameId).eq("memberId", args.newMemberId)
        )
        .first();

      if (existingNewMembership) {
        // If the user already has a membership in this game with their new ID,
        // just delete the old one
        await ctx.db.delete(membership._id);
      } else {
        // Update the memberId to the new one
        await ctx.db.patch(membership._id, {
          memberId: args.newMemberId,
        });
        migratedCount++;
      }
    }

    // Also update any team captainIds that reference the old memberId
    const teamsWithOldCaptain = await ctx.db
      .query("teams")
      .filter((q) => q.eq(q.field("captainId"), args.oldMemberId))
      .collect();

    for (const team of teamsWithOldCaptain) {
      await ctx.db.patch(team._id, {
        captainId: args.newMemberId,
      });
    }

    // Also update scoreboard data in games (playerId references)
    const allGames = await ctx.db.query("games").collect();
    for (const game of allGames) {
      if (!game.scores) continue;

      let scoresUpdated = false;
      const newScores = { ...game.scores };

      for (const [questionNum, questionData] of Object.entries(newScores)) {
        const qData = questionData as any;
        if (qData.tossup) {
          for (const [teamId, tossupData] of Object.entries(qData.tossup)) {
            const td = tossupData as any;
            if (td.playerId === args.oldMemberId) {
              (qData.tossup as any)[teamId] = {
                ...td,
                playerId: args.newMemberId,
              };
              scoresUpdated = true;
            }
          }
        }
      }

      if (scoresUpdated) {
        await ctx.db.patch(game._id, {
          scores: newScores,
          lastUpdated: Date.now(),
        });
      }
    }

    return { migratedCount };
  },
});
