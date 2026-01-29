import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getGame, unwrapOrThrow } from "./helpers";

// ============================================================================
// TAG VALIDATION
// ============================================================================

/**
 * Validates and normalizes a tag:
 * - Converts spaces to dashes
 * - Converts to lowercase
 * - Only allows alphanumeric characters and dashes
 * - Trims and removes consecutive dashes
 * Returns null if the tag is invalid (empty or contains only invalid characters)
 */
function normalizeTag(tag: string): string | null {
  // Convert spaces to dashes and lowercase
  let normalized = tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

  // Remove any character that isn't alphanumeric or dash
  normalized = normalized.replace(/[^a-z0-9-]/g, "");

  // Remove consecutive dashes and leading/trailing dashes
  normalized = normalized
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // Return null if empty after normalization
  if (normalized.length === 0) {
    return null;
  }

  // Limit tag length
  if (normalized.length > 50) {
    normalized = normalized.substring(0, 50);
  }

  return normalized;
}

/**
 * Validates and normalizes an array of tags
 * Returns only valid, unique tags
 */
function normalizeTags(tags: string[]): string[] {
  const normalized = tags
    .map(normalizeTag)
    .filter((tag): tag is string => tag !== null);

  // Remove duplicates
  return [...new Set(normalized)];
}

// ============================================================================
// PUBLIC TAGS (on games, moderator-only)
// ============================================================================

/**
 * Query: Get public tags for a game
 */
export const getPublicTags = query({
  args: {
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first();

    return game?.tags ?? [];
  },
});

/**
 * Mutation: Add public tags to a game (moderator only - caller must verify)
 */
export const addPublicTags = mutation({
  args: {
    gameId: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const game = unwrapOrThrow(await getGame(ctx, args.gameId));

    const existingTags = game.tags ?? [];
    const newTags = normalizeTags(args.tags);
    const mergedTags = [...new Set([...existingTags, ...newTags])];

    await ctx.db.patch(game._id, {
      tags: mergedTags,
      lastUpdated: Date.now(),
    });

    return mergedTags;
  },
});

/**
 * Mutation: Remove a public tag from a game (moderator only - caller must verify)
 */
export const removePublicTag = mutation({
  args: {
    gameId: v.string(),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const game = unwrapOrThrow(await getGame(ctx, args.gameId));

    const normalizedTag = normalizeTag(args.tag);
    if (!normalizedTag) {
      return game.tags ?? [];
    }

    const updatedTags = (game.tags ?? []).filter((t) => t !== normalizedTag);

    await ctx.db.patch(game._id, {
      tags: updatedTags,
      lastUpdated: Date.now(),
    });

    return updatedTags;
  },
});

/**
 * Mutation: Set all public tags for a game (replaces existing)
 */
export const setPublicTags = mutation({
  args: {
    gameId: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const game = unwrapOrThrow(await getGame(ctx, args.gameId));

    const normalizedTags = normalizeTags(args.tags);

    await ctx.db.patch(game._id, {
      tags: normalizedTags,
      lastUpdated: Date.now(),
    });

    return normalizedTags;
  },
});

// ============================================================================
// PRIVATE TAGS (per user)
// ============================================================================

/**
 * Helper: Get or create user document
 */
async function getOrCreateUser(ctx: any, userId: string) {
  let user = await ctx.db
    .query("users")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();

  if (!user) {
    const id = await ctx.db.insert("users", {
      userId,
      privateTags: {},
    });
    user = await ctx.db.get(id);
  }

  return user;
}

/**
 * Query: Get all private tags for a user
 * Returns Record<tag, gameId[]>
 */
export const getPrivateTags = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return (user?.privateTags as Record<string, string[]>) ?? {};
  },
});

/**
 * Query: Get private tags for a specific game
 */
export const getPrivateTagsForGame = query({
  args: {
    userId: v.string(),
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user || !user.privateTags) {
      return [];
    }

    const privateTags = user.privateTags as Record<string, string[]>;
    const tagsForGame: string[] = [];

    for (const [tag, gameIds] of Object.entries(privateTags)) {
      if (gameIds.includes(args.gameId)) {
        tagsForGame.push(tag);
      }
    }

    return tagsForGame;
  },
});

/**
 * Query: Get all games for a specific private tag
 */
export const getGamesForPrivateTag = query({
  args: {
    userId: v.string(),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedTag = normalizeTag(args.tag);
    if (!normalizedTag) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user || !user.privateTags) {
      return [];
    }

    const privateTags = user.privateTags as Record<string, string[]>;
    return privateTags[normalizedTag] ?? [];
  },
});

/**
 * Mutation: Add a private tag to a game
 */
export const addPrivateTag = mutation({
  args: {
    userId: v.string(),
    gameId: v.string(),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedTag = normalizeTag(args.tag);
    if (!normalizedTag) {
      throw new Error("Invalid tag");
    }

    const user = await getOrCreateUser(ctx, args.userId);
    const privateTags = (user.privateTags as Record<string, string[]>) ?? {};

    // Add gameId to the tag's list if not already present
    if (!privateTags[normalizedTag]) {
      privateTags[normalizedTag] = [];
    }

    if (!privateTags[normalizedTag].includes(args.gameId)) {
      privateTags[normalizedTag].push(args.gameId);
    }

    await ctx.db.patch(user._id, {
      privateTags,
    });

    return privateTags;
  },
});

/**
 * Mutation: Remove a private tag from a game
 */
export const removePrivateTag = mutation({
  args: {
    userId: v.string(),
    gameId: v.string(),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedTag = normalizeTag(args.tag);
    if (!normalizedTag) {
      return {};
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      return {};
    }

    const privateTags = (user.privateTags as Record<string, string[]>) ?? {};

    if (privateTags[normalizedTag]) {
      privateTags[normalizedTag] = privateTags[normalizedTag].filter(
        (id) => id !== args.gameId
      );

      // Remove the tag entirely if no games are associated
      if (privateTags[normalizedTag].length === 0) {
        delete privateTags[normalizedTag];
      }
    }

    await ctx.db.patch(user._id, {
      privateTags,
    });

    return privateTags;
  },
});

/**
 * Mutation: Add multiple private tags to a game at once
 */
export const addPrivateTags = mutation({
  args: {
    userId: v.string(),
    gameId: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedTags = normalizeTags(args.tags);
    if (normalizedTags.length === 0) {
      throw new Error("No valid tags provided");
    }

    const user = await getOrCreateUser(ctx, args.userId);
    const privateTags = (user.privateTags as Record<string, string[]>) ?? {};

    for (const tag of normalizedTags) {
      if (!privateTags[tag]) {
        privateTags[tag] = [];
      }
      if (!privateTags[tag].includes(args.gameId)) {
        privateTags[tag].push(args.gameId);
      }
    }

    await ctx.db.patch(user._id, {
      privateTags,
    });

    return privateTags;
  },
});

/**
 * Mutation: Set all private tags for a game (replaces existing for that game)
 */
export const setPrivateTagsForGame = mutation({
  args: {
    userId: v.string(),
    gameId: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedTags = normalizeTags(args.tags);

    const user = await getOrCreateUser(ctx, args.userId);
    const privateTags = (user.privateTags as Record<string, string[]>) ?? {};

    // First, remove the gameId from all existing tags
    for (const tag of Object.keys(privateTags)) {
      const tagGames = privateTags[tag];
      if (tagGames) {
        privateTags[tag] = tagGames.filter((id) => id !== args.gameId);
        if (privateTags[tag]!.length === 0) {
          delete privateTags[tag];
        }
      }
    }

    // Then, add the gameId to the new tags
    for (const tag of normalizedTags) {
      if (!privateTags[tag]) {
        privateTags[tag] = [];
      }
      privateTags[tag].push(args.gameId);
    }

    await ctx.db.patch(user._id, {
      privateTags,
    });

    return privateTags;
  },
});

// ============================================================================
// COMBINED QUERIES
// ============================================================================

/**
 * Query: Get all tags for a game (both public and private for the user)
 */
export const getAllTagsForGame = query({
  args: {
    gameId: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get public tags
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .first();

    const publicTags = game?.tags ?? [];

    // Get private tags if userId provided
    let privateTags: string[] = [];
    if (args.userId) {
      const userId = args.userId;
      const user = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();

      if (user?.privateTags) {
        const userPrivateTags = user.privateTags as Record<string, string[]>;
        for (const [tag, gameIds] of Object.entries(userPrivateTags)) {
          if (gameIds.includes(args.gameId)) {
            privateTags.push(tag);
          }
        }
      }
    }

    return {
      publicTags,
      privateTags,
    };
  },
});
