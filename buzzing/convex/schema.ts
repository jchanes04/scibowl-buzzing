import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({


    games: defineTable({
        joinCode: v.string(),
        name: v.string(),
        ownerId: v.string(), // moderator externalId
        settings: v.object({
            individualsAllowed: v.boolean(),
            newTeamsAllowed: v.boolean(),
            spectatorsAllowed: v.boolean()
        }),
        times: v.object({
            tossup: v.array(v.float64()),
            bonus: v.array(v.float64()),
            visual: v.array(v.float64())
        }),
        lastActive: v.number(),
        scoreboard: v.string(), // JSON stringified ScoreboardData
        // Question timer state (for tossup/bonus timing)
        questionTimer: v.optional(v.object({
            startedAt: v.number(),      // Server timestamp when timer started
            duration: v.number(),        // Duration in seconds
            pausedAt: v.optional(v.number()), // Server timestamp when paused (if paused)
        })),
        // Game clock state (overall match timing)
        gameClock: v.optional(v.object({
            startedAt: v.number(),      // Server timestamp when started
            duration: v.number(),        // Total duration in seconds
            pausedAt: v.optional(v.number()), // Server timestamp when paused
            ended: v.optional(v.boolean()),   // True if clock reached zero
        })),
    }).index("by_joinCode", ["joinCode"]),

    teams: defineTable({
        gameId: v.id("games"),
        externalId: v.string(), // Custom ID
        name: v.string(),
        type: v.union(v.literal("default"), v.literal("created"), v.literal("individual")), // "created" etc
    }).index("by_gameId", ["gameId"]).index("by_externalId", ["externalId"]),

    players: defineTable({
        gameId: v.id("games"),
        externalId: v.string(),
        teamId: v.optional(v.string()), // refers to team externalId
        name: v.string(),
        isCaptain: v.optional(v.boolean()),
        connected: v.boolean(), // false if left
    }).index("by_gameId", ["gameId"]).index("by_externalId", ["externalId"]).index("by_gameId_externalId", ["gameId", "externalId"]),

    moderators: defineTable({
        gameId: v.id("games"),
        externalId: v.string(),
        name: v.string(),
        connected: v.boolean(),
    }).index("by_gameId", ["gameId"]).index("by_externalId", ["externalId"]).index("by_gameId_externalId", ["gameId", "externalId"]),
    chatMessages: defineTable({
        gameId: v.string(),
        type: v.union(
          v.literal("notification"),
          v.literal("buzz"),
          v.literal("success"),
          v.literal("warning")
        ),
        text: v.string(),
      }).index("by_gameId", ["gameId"]),
});
