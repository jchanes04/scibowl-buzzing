/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as clearTables from "../clearTables.js";
import type * as crons from "../crons.js";
import type * as gameHistory from "../gameHistory.js";
import type * as games from "../games.js";
import type * as helpers from "../helpers.js";
import type * as tags from "../tags.js";
import type * as tournaments from "../tournaments.js";
import type * as types from "../types.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  clearTables: typeof clearTables;
  crons: typeof crons;
  gameHistory: typeof gameHistory;
  games: typeof games;
  helpers: typeof helpers;
  tags: typeof tags;
  tournaments: typeof tournaments;
  types: typeof types;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
