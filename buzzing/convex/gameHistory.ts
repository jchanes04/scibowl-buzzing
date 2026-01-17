import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get all games a member has participated in (for game history)
 * Uses denormalized gameSnapshot data when available for efficiency
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

    // Process memberships - use snapshot data when available
    const games = await Promise.all(
      memberships.map(async (membership) => {
        // If we have a snapshot (member has left), use it directly
        if (membership.gameSnapshot) {
          return {
            gameId: membership.gameId,
            name: membership.gameSnapshot.name,
            createdAt: membership.gameSnapshot.createdAt,
            isActive: membership.gameSnapshot.isActive,
            memberType: membership.type,
            memberName: membership.name,
            playerNames: membership.gameSnapshot.playerNames,
            teamNames: membership.gameSnapshot.teamNames,
            scores: membership.gameSnapshot.scores,
            pointValues: membership.gameSnapshot.pointValues,
            tags: membership.gameSnapshot.tags,
          };
        }

        // For active members without snapshot, fetch game data (only happens for in-progress games)
        const game = await ctx.db
          .query("games")
          .withIndex("by_gameId", (q) => q.eq("gameId", membership.gameId))
          .first();

        if (!game) return null;

        return {
          gameId: game.gameId,
          name: game.name,
          createdAt: game.createdAt,
          isActive: game.isActive ?? false,
          memberType: membership.type,
          memberName: membership.name,
          playerNames: game.playerNames ?? {},
          teamNames: game.teamNames ?? {},
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

    // Find all memberships with the new memberId upfront (avoids N queries in the loop)
    const newMemberships = await ctx.db
      .query("gameMembers")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.newMemberId))
      .collect();

    // Create a Set of gameIds where the new member already has a membership
    const newMemberGameIds = new Set(newMemberships.map((m) => m.gameId));

    let migratedCount = 0;

    for (const membership of oldMemberships) {
      // Check if the new memberId already has a membership in this game
      if (newMemberGameIds.has(membership.gameId)) {
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

    // Also update scoreboard data and playerNames in games (playerId references)
    const allGames = await ctx.db.query("games").collect();
    for (const game of allGames) {
      let scoresUpdated = false;
      let playerNamesUpdated = false;
      const newScores = { ...game.scores };
      const newPlayerNames = { ...(game.playerNames ?? {}) };

      // Update playerNames - migrate the key from oldMemberId to newMemberId
      if (args.oldMemberId in newPlayerNames) {
        newPlayerNames[args.newMemberId] = newPlayerNames[args.oldMemberId];
        delete newPlayerNames[args.oldMemberId];
        playerNamesUpdated = true;
      }

      // Update scores - migrate playerId references
      if (game.scores) {
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
      }

      if (scoresUpdated || playerNamesUpdated) {
        const patchData: any = {};
        if (scoresUpdated) {
          patchData.scores = newScores;
        }
        if (playerNamesUpdated) {
          patchData.playerNames = newPlayerNames;
        }
        if (scoresUpdated || playerNamesUpdated) {
          await ctx.db.patch(game._id, patchData);
        }
      }
    }

    return { migratedCount };
  },
});
