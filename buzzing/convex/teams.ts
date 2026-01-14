import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const teamTypeValidator = v.union(
  v.literal("default"),
  v.literal("created"),
  v.literal("individual")
);

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

// Get all teams including inactive
export const getAllForGame = query({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("teams")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

// Add new team or reactivate existing
export const add = mutation({
  args: {
    gameId: v.string(),
    teamId: v.string(),
    name: v.string(),
    type: teamTypeValidator,
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
      // Reactivate
      await ctx.db.patch(existing._id, { isActive: true });
      return existing._id;
    }

    return ctx.db.insert("teams", {
      gameId: args.gameId,
      teamId: args.teamId,
      name: args.name,
      type: args.type,
      captainId: args.captainId,
      isActive: true,
    });
  },
});

// Deactivate team (soft delete)
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
      await ctx.db.patch(team._id, { isActive: false });
    }
  },
});

// Change team captain
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
      await ctx.db.patch(team._id, { captainId: args.captainId });
    }
  },
});

// Clear all teams for game (when game ends)
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
