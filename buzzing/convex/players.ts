import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByGameId = query({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId as any))
      .collect();
  },
});

export const rename = mutation({
  args: { gameId: v.string(), externalId: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_gameId_externalId", (q) => q.eq("gameId", args.gameId as any).eq("externalId", args.externalId as any))
      .first();
    if (player) {
      await ctx.db.patch(player._id, { name: args.name });
    }
  },
});

export const claimCaptain = mutation({
  args: { gameId: v.id("games"), playerId: v.string() },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_gameId_externalId", (q) =>
        q.eq("gameId", args.gameId).eq("externalId", args.playerId)
      )
      .first();
    if (!player || !player.teamId) return;

    // Clear other captains on same team
    const teammates = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("teamId"), player.teamId))
      .collect();

    for (const mate of teammates) {
      if (mate.isCaptain) {
        await ctx.db.patch(mate._id, { isCaptain: false });
      }
    }

    await ctx.db.patch(player._id, { isCaptain: true });
  },
});

export const promoteToModerator = mutation({
  args: { gameId: v.id("games"), playerId: v.string() },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_gameId_externalId", (q) =>
        q.eq("gameId", args.gameId).eq("externalId", args.playerId)
      )
      .first();
    if (!player) return;

    // Create moderator record
    await ctx.db.insert("moderators", {
      gameId: args.gameId,
      externalId: args.playerId,
      name: player.name,
      connected: player.connected,
    });

    // Delete player record
    await ctx.db.delete(player._id);

    // Send notification
    await ctx.db.insert("chatMessages", {
      gameId: args.gameId as any,
      type: "notification",
      text: `${player.name} has been promoted to moderator`,
    });
  },
});