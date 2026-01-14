import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chatMessages: defineTable({
    gameId: v.string(),
    text: v.string(),
    type: v.union(
      v.literal("buzz"),
      v.literal("notification"),
      v.literal("warning"),
      v.literal("success")
    ),
    // null/undefined = broadcast to all, array = targeted member IDs
    target: v.optional(v.array(v.string())),
    timestamp: v.number(),
  })
    .index("by_gameId", ["gameId"])
    .index("by_gameId_timestamp", ["gameId", "timestamp"]),

  scoreboard: defineTable({
    gameId: v.string(),
    // Store scores as an object with string keys (question numbers) and QuestionPairScore values
    scores: v.any(), // Using v.any() for the complex nested structure
    pointValues: v.object({
      tossup: v.number(),
      bonus: v.number(),
      penalty: v.number(),
    }),
    lastUpdated: v.number(),
  })
    .index("by_gameId", ["gameId"]),
});
