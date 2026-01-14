import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// 24 hours TTL
const TTL_MS = 24 * 60 * 60 * 1000;

// Message type validator (reusable)
const messageTypeValidator = v.union(
  v.literal("buzz"),
  v.literal("notification"),
  v.literal("warning"),
  v.literal("success")
);

/**
 * Query: Get chat messages for a game, filtered by current member
 *
 * Filtering logic:
 * - Include messages where target is null/undefined (broadcast)
 * - Include messages where target array contains the memberId
 */
export const getForGame = query({
  args: {
    gameId: v.string(),
    memberId: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_gameId_timestamp", (q) => q.eq("gameId", args.gameId))
      .order("asc")
      .collect();

    // Filter for broadcast messages or messages targeted at this member
    return messages
      .filter((msg) => {
        if (!msg.target || msg.target.length === 0) {
          return true; // Broadcast message
        }
        return msg.target.includes(args.memberId);
      })
      .map((msg) => ({
        _id: msg._id,
        text: msg.text,
        type: msg.type,
        timestamp: msg.timestamp,
      }));
  },
});

/**
 * Mutation: Add a new chat message
 *
 * Schedules automatic deletion after TTL_MS
 */
export const add = mutation({
  args: {
    gameId: v.string(),
    text: v.string(),
    type: messageTypeValidator,
    target: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    // Insert the message
    const messageId = await ctx.db.insert("chatMessages", {
      gameId: args.gameId,
      text: args.text,
      type: args.type,
      target: args.target,
      timestamp,
    });

    // Schedule deletion after TTL
    await ctx.scheduler.runAfter(TTL_MS, internal.chatMessages.deleteMessage, {
      messageId,
    });

    return messageId;
  },
});

/**
 * Mutation: Clear all messages for a game
 *
 * Used when a game ends
 */
export const clearForGame = mutation({
  args: {
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
  },
});

/**
 * Internal mutation: Delete a single message (for TTL)
 */
export const deleteMessage = internalMutation({
  args: {
    messageId: v.id("chatMessages"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (message) {
      await ctx.db.delete(args.messageId);
    }
  },
});

/**
 * Internal mutation: Cleanup messages older than TTL
 *
 * Backup for any messages that didn't get cleaned by scheduled deletion
 */
export const cleanupOldMessages = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - TTL_MS;

    const oldMessages = await ctx.db
      .query("chatMessages")
      .withIndex("by_gameId_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoff))
      .collect();

    for (const msg of oldMessages) {
      await ctx.db.delete(msg._id);
    }
  },
});
