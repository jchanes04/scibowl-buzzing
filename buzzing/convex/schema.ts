import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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

    // Socket-authoritative member/team state (persisted on score updates)
    members: v.optional(v.any()), // Record<string, CachedMember> - full member records
    teams: v.optional(v.any()), // Record<string, CachedTeam> - full team records

    // Public tags (added by moderators, visible to all)
    tags: v.optional(v.array(v.string())),

    // Timestamps
    createdAt: v.number(),
    lastUpdated: v.number(),

    // Game state
    isActive: v.optional(v.boolean()), // Whether game is in memory (socket server)
    isCompleted: v.optional(v.boolean()), // Whether game has ended (set on endGame)

    // Tournament link (if this game is part of a tournament)
    tournamentId: v.optional(v.string()),
    tournamentMatchIndex: v.optional(v.number()), // 0=semifinal1, 1=semifinal2, 2=final
    tournamentMatchBracket: v.optional(v.union(v.literal("winners"), v.literal("losers"), v.literal("grand_final"), v.literal("roundrobin"))), // For double elimination or round robin
    moderatorJoinCode: v.optional(v.string()), // Legacy field for existing data
  })
    .index("by_gameId", ["gameId"])
    .index("by_joinCode", ["joinCode"])
    .index("by_tournamentId", ["tournamentId"]),

  // User data for private tags and game history
  // privateTags is a Record<tag, gameId[]> mapping tags to arrays of game IDs
  // gameIds tracks all games this user has participated in
  users: defineTable({
    userId: v.string(),
    privateTags: v.any(), // Record<string, string[]>
    gameIds: v.optional(v.array(v.string())),
  })
    .index("by_userId", ["userId"]),

  // Tournament data
  tournaments: defineTable({
    tournamentId: v.string(),
    name: v.string(),
    organizerId: v.optional(v.string()), // New format
    settings: v.optional(v.object({
      spectatorsAllowed: v.boolean(),
      times: v.object({
        tossup: v.array(v.number()),
        bonus: v.array(v.number()),
        visual: v.array(v.number()),
      }),
      pointValues: v.object({
        tossup: v.number(),
        bonus: v.number(),
        penalty: v.number(),
      }),
      minPlayers: v.number(),
      maxPlayers: v.number(),
    })),
    bracketSeeds: v.optional(v.array(v.object({
      seed: v.number(),
      teamId: v.string()
    }))),
    bracket: v.optional(v.object({
      gameIds: v.array(v.string()),
      results: v.array(v.object({
        matchIndex: v.number(),
        bracket: v.optional(v.union(v.literal("winners"), v.literal("losers"), v.literal("grand_final"), v.literal("roundrobin"))), // For double elimination or round robin
        winningTeamId: v.string(),
      })),
    })),
    bracketType: v.optional(v.union(v.literal("single"), v.literal("double"), v.literal("roundrobin"))), // Single elimination, double elimination, or round robin
    winnerTakesAll: v.optional(v.boolean()), // For double elimination: whether bracket reset is enabled
    createdAt: v.number(),
    ownerId: v.optional(v.string()),
    bracketSize: v.optional(v.number()), // Number of teams in the bracket (any size)
    bracketConfirmed: v.optional(v.boolean()), // Whether bracket structure is locked
  })
    .index("by_tournamentId", ["tournamentId"])
    .index("by_organizerId", ["organizerId"]),

  // Tournament team registrations (canonical team identity)
  // Teams in this table are created during registration, before any game
  // When players join a game, a corresponding entry is created in the teams table
  tournamentTeams: defineTable({
    tournamentTeamId: v.string(),      // Unique ID for this team (used as teamId in games)
    tournamentId: v.string(),          // Which tournament this team belongs to
    name: v.string(),                  // Team name
    playerNames: v.array(v.string()),  // List of registered player names
    registeredBy: v.string(),          // userId who registered the team
    createdAt: v.number(),             // Registration timestamp
  })
    .index("by_tournamentId", ["tournamentId"])
    .index("by_tournamentTeamId", ["tournamentTeamId"]),

});
