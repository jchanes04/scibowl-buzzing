import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

// Get all members for a game (for client subscription)
export const getForGame = query({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("gameMembers")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    return members.map((m) => ({
      id: m.memberId,
      name: m.name,
      type: m.type,
      teamId: m.teamId,
      isActive: m.isActive,
    }));
  },
});

// Get all members including inactive (for server rejoin lookup)
export const getAllForGame = query({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("gameMembers")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    return members.map((m) => ({
      id: m.memberId,
      name: m.name,
      type: m.type,
      teamId: m.teamId,
      isActive: m.isActive,
      leftAt: m.leftAt,
    }));
  },
});

// Add a new member or reactivate an existing inactive member
export const add = mutation({
  args: {
    gameId: v.string(),
    memberId: v.string(),
    name: v.string(),
    type: v.union(v.literal("player"), v.literal("moderator")),
    teamId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if member already exists
    const existing = await ctx.db
      .query("gameMembers")
      .withIndex("by_gameId_memberId", (q) =>
        q.eq("gameId", args.gameId).eq("memberId", args.memberId)
      )
      .first();

    if (existing) {
      // Reactivate existing member
      await ctx.db.patch(existing._id, {
        name: args.name,
        type: args.type,
        teamId: args.teamId,
        isActive: true,
        leftAt: undefined,
      });
      return existing._id;
    }

    // Create new member
    return await ctx.db.insert("gameMembers", {
      gameId: args.gameId,
      memberId: args.memberId,
      name: args.name,
      type: args.type,
      teamId: args.teamId,
      isActive: true,
    });
  },
});

// Soft delete - mark member as inactive (for disconnect)
export const leave = mutation({
  args: {
    gameId: v.string(),
    memberId: v.string(),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("gameMembers")
      .withIndex("by_gameId_memberId", (q) =>
        q.eq("gameId", args.gameId).eq("memberId", args.memberId)
      )
      .first();

    if (member) {
      await ctx.db.patch(member._id, {
        isActive: false,
        leftAt: Date.now(),
      });
    }
  },
});

// Hard delete - remove member entirely (for kick, no rejoin allowed)
export const kick = mutation({
  args: {
    gameId: v.string(),
    memberId: v.string(),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("gameMembers")
      .withIndex("by_gameId_memberId", (q) =>
        q.eq("gameId", args.gameId).eq("memberId", args.memberId)
      )
      .first();

    if (member) {
      await ctx.db.delete(member._id);
    }
  },
});

// Promote player to moderator
export const promote = mutation({
  args: {
    gameId: v.string(),
    memberId: v.string(),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("gameMembers")
      .withIndex("by_gameId_memberId", (q) =>
        q.eq("gameId", args.gameId).eq("memberId", args.memberId)
      )
      .first();

    if (member) {
      await ctx.db.patch(member._id, {
        type: "moderator",
        teamId: undefined,
      });
    }
  },
});

// Rename a member
export const rename = mutation({
  args: {
    gameId: v.string(),
    memberId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("gameMembers")
      .withIndex("by_gameId_memberId", (q) =>
        q.eq("gameId", args.gameId).eq("memberId", args.memberId)
      )
      .first();

    if (member) {
      await ctx.db.patch(member._id, {
        name: args.name,
      });
    }
  },
});

// Delete all members for a game (game end cleanup)
export const clearForGame = mutation({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("gameMembers")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    for (const member of members) {
      await ctx.db.delete(member._id);
    }
  },
});
