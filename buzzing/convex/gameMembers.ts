import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

const memberTypeValidator = v.union(v.literal("player"), v.literal("moderator"));

// Get active members for a game (for client subscription)
export const getForGame = query({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("gameMembers")
      .withIndex("by_gameId_active", (q) =>
        q.eq("gameId", args.gameId).eq("isActive", true)
      )
      .collect();

    return members.map((m) => ({
      id: m.memberId,
      name: m.name,
      type: m.type,
      teamId: m.teamId,
    }));
  },
});

// Get all members including inactive (for server rejoin logic)
export const getAllForGame = query({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("gameMembers")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

// Add new member or reactivate existing (join/rejoin)
export const add = mutation({
  args: {
    gameId: v.string(),
    memberId: v.string(),
    name: v.string(),
    type: memberTypeValidator,
    teamId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if member already exists (rejoining)
    const existing = await ctx.db
      .query("gameMembers")
      .withIndex("by_gameId_memberId", (q) =>
        q.eq("gameId", args.gameId).eq("memberId", args.memberId)
      )
      .first();

    if (existing) {
      // Reactivate
      await ctx.db.patch(existing._id, {
        isActive: true,
        leftAt: undefined,
        name: args.name,
        type: args.type,
        teamId: args.teamId,
      });
      return existing._id;
    }

    return ctx.db.insert("gameMembers", {
      gameId: args.gameId,
      memberId: args.memberId,
      name: args.name,
      type: args.type,
      teamId: args.teamId,
      isActive: true,
    });
  },
});

// Member leaves (soft delete for rejoin capability)
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

// Kick player (hard delete - no rejoin allowed)
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

    if (member && member.type === "player") {
      await ctx.db.patch(member._id, {
        type: "moderator",
        teamId: undefined, // Moderators don't have teams
      });
    }
  },
});

// Rename member
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
      await ctx.db.patch(member._id, { name: args.name });
    }
  },
});

// Clear all members for game (when game ends)
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
