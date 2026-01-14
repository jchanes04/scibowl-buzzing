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
    // Game identity
    gameId: v.string(),
    joinCode: v.string(),
    name: v.string(),

    // Settings
    settings: v.object({
      individualsAllowed: v.boolean(),
      newTeamsAllowed: v.boolean(),
      spectatorsAllowed: v.boolean(),
    }),

    // Time limits [clientTime, serverLatencyBuffer]
    times: v.object({
      tossup: v.array(v.number()),
      bonus: v.array(v.number()),
      visual: v.array(v.number()),
    }),

    // Scoreboard (consolidated from separate table)
    scoreboard: v.object({
      pointValues: v.object({
        tossup: v.number(),
        bonus: v.number(),
        penalty: v.number(),
      }),
      scores: v.any(), // Complex nested structure
    }),

    // Timestamp-based timers (startTime + duration approach)
    questionTimerStartTime: v.optional(v.number()),
    questionTimerDuration: v.optional(v.number()),
    questionTimerType: v.optional(
      v.union(v.literal("tossup"), v.literal("bonus"), v.literal("visual"))
    ),
    gameClockStartTime: v.optional(v.number()),
    gameClockDuration: v.optional(v.number()),

    // Metadata
    createdAt: v.number(),
    lastActive: v.number(),
  })
    .index("by_gameId", ["gameId"])
    .index("by_joinCode", ["joinCode"]),

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
