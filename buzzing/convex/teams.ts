import { query } from "./_generated/server";
import { v } from "convex/values";

export const getByGameId = query({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teams")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId as any))
      .collect();
  },
});