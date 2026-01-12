import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// 1. Get messages for a specific game
export const list = query({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .order("desc") // Get newest first
      .take(100);    // Limit to 100 messages
  },
});

// 2. Add a new message
export const send = mutation({
  args: { 
    gameId: v.string(), 
    type: v.union(v.literal("notification"), v.literal("buzz"), v.literal("success"), v.literal("warning")), 
    text: v.string() 
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("chatMessages", {
      gameId: args.gameId,
      type: args.type,
      text: args.text,
    });
  },
});