import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get active teams for a game (for client subscription)
export const getForGame = query({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_gameId_active", (q) =>
        q.eq("gameId", args.gameId).eq("isActive", true)
      )
      .collect();

    return teams.map((t) => ({
      teamId: t.teamId,
      name: t.name,
      type: t.type,
      captainId: t.captainId,
    }));
  },
});

// Get all teams including inactive (for server lookup)
export const getAllForGame = query({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    return teams.map((t) => ({
      teamId: t.teamId,
      name: t.name,
      type: t.type,
      captainId: t.captainId,
      isActive: t.isActive,
    }));
  },
});

// Add a new team or reactivate an existing inactive team
export const add = mutation({
  args: {
    gameId: v.string(),
    teamId: v.string(),
    name: v.string(),
    type: v.union(v.literal("default"), v.literal("created"), v.literal("individual")),
    captainId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if team already exists
    const existing = await ctx.db
      .query("teams")
      .withIndex("by_gameId_teamId", (q) =>
        q.eq("gameId", args.gameId).eq("teamId", args.teamId)
      )
      .first();

    if (existing) {
      // Reactivate existing team
      await ctx.db.patch(existing._id, {
        name: args.name,
        type: args.type,
        captainId: args.captainId,
        isActive: true,
      });
      return existing._id;
    }

    // Create new team
    return await ctx.db.insert("teams", {
      gameId: args.gameId,
      teamId: args.teamId,
      name: args.name,
      type: args.type,
      captainId: args.captainId,
      isActive: true,
    });
  },
});

// Deactivate a team (soft delete)
export const deactivate = mutation({
  args: {
    gameId: v.string(),
    teamId: v.string(),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db
      .query("teams")
      .withIndex("by_gameId_teamId", (q) =>
        q.eq("gameId", args.gameId).eq("teamId", args.teamId)
      )
      .first();

    if (team) {
      await ctx.db.patch(team._id, {
        isActive: false,
      });
    }
  },
});

// Change captain of a team
export const changeCaptain = mutation({
  args: {
    gameId: v.string(),
    teamId: v.string(),
    captainId: v.string(),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db
      .query("teams")
      .withIndex("by_gameId_teamId", (q) =>
        q.eq("gameId", args.gameId).eq("teamId", args.teamId)
      )
      .first();

    if (team) {
      await ctx.db.patch(team._id, {
        captainId: args.captainId,
      });
    }
  },
});

// Delete all teams for a game (game end cleanup)
export const clearForGame = mutation({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    for (const team of teams) {
      await ctx.db.delete(team._id);
    }
  },
});
