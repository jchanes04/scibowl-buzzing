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

  games: defineTable({
    // Game identification
    gameId: v.string(),
    joinCode: v.string(),
    name: v.string(),

    // Settings (immutable after creation)
    settings: v.object({
      individualsAllowed: v.boolean(),
      newTeamsAllowed: v.boolean(),
      spectatorsAllowed: v.boolean(),
    }),

    // Timer configuration (immutable after creation)
    times: v.object({
      tossup: v.array(v.number()),
      bonus: v.array(v.number()),
      visual: v.array(v.number()),
    }),

    // Scoreboard data (mutable via mutations)
    scores: v.any(), // Record<number, QuestionPairScore>
    pointValues: v.object({
      tossup: v.number(),
      bonus: v.number(),
      penalty: v.number(),
    }),

    // Public tags (added by moderators, visible to all)
    tags: v.optional(v.array(v.string())),

    // Timestamps
    createdAt: v.number(),
    lastUpdated: v.number(),

    // Game state
    isActive: v.optional(v.boolean()),
  })
    .index("by_gameId", ["gameId"])
    .index("by_joinCode", ["joinCode"]),

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
    .index("by_gameId_active", ["gameId", "isActive"])
    .index("by_memberId", ["memberId"]),

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

  // User data for private tags
  // privateTags is a Record<tag, gameId[]> mapping tags to arrays of game IDs
  users: defineTable({
    userId: v.string(),
    privateTags: v.any(), // Record<string, string[]>
  })
    .index("by_userId", ["userId"]),
});
