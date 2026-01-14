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

  gameMembers: defineTable({
    gameId: v.string(),
    memberId: v.string(),
    name: v.string(),
    type: v.union(v.literal("player"), v.literal("moderator")),
    teamId: v.optional(v.string()),
    isActive: v.boolean(),
    leftAt: v.optional(v.number()),
  })
    .index("by_gameId", ["gameId"])
    .index("by_gameId_memberId", ["gameId", "memberId"])
    .index("by_gameId_active", ["gameId", "isActive"]),

  teams: defineTable({
    gameId: v.string(),
    teamId: v.string(),
    name: v.string(),
    type: v.union(v.literal("default"), v.literal("created"), v.literal("individual")),
    captainId: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_gameId", ["gameId"])
    .index("by_gameId_teamId", ["gameId", "teamId"])
    .index("by_gameId_active", ["gameId", "isActive"]),
});
