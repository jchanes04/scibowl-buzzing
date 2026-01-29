/**
 * Shared Result-returning helpers for Convex query/mutation handlers.
 *
 * These functions use neverthrow internally for composition. At the handler
 * boundary, call `unwrapOrThrow(result)` to convert back to throws (since
 * Result instances cannot be serialized over the wire).
 */
import { ok, err, type Result } from "neverthrow";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx, MutationCtx } from "./_generated/server";

// ---------------------------------------------------------------------------
// Internal error types (not exposed over the wire)
// ---------------------------------------------------------------------------

export interface InternalNotFound {
    readonly type: "InternalNotFound";
    readonly entity: string;
    readonly id?: string;
    readonly message: string;
}

export interface InternalBusinessRule {
    readonly type: "InternalBusinessRule";
    readonly message: string;
}

export type InternalError = InternalNotFound | InternalBusinessRule;

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

export function internalNotFound(entity: string, id?: string): InternalNotFound {
    return {
        type: "InternalNotFound",
        entity,
        id,
        message: id ? `${entity} not found: ${id}` : `${entity} not found`,
    };
}

export function internalBusinessRule(message: string): InternalBusinessRule {
    return { type: "InternalBusinessRule", message };
}

// ---------------------------------------------------------------------------
// Entity lookup helpers
// ---------------------------------------------------------------------------

export async function getTournament(
    ctx: QueryCtx | MutationCtx,
    tournamentId: string,
): Promise<Result<Doc<"tournaments">, InternalNotFound>> {
    const tournament = await ctx.db
        .query("tournaments")
        .withIndex("by_tournamentId", (q) => q.eq("tournamentId", tournamentId))
        .first();

    if (!tournament) {
        return err(internalNotFound("Tournament", tournamentId));
    }
    return ok(tournament);
}

export async function getGame(
    ctx: QueryCtx | MutationCtx,
    gameId: string,
): Promise<Result<Doc<"games">, InternalNotFound>> {
    const game = await ctx.db
        .query("games")
        .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
        .first();

    if (!game) {
        return err(internalNotFound("Game", gameId));
    }
    return ok(game);
}

export async function getTournamentTeam(
    ctx: QueryCtx | MutationCtx,
    teamId: string,
): Promise<Result<Doc<"tournamentTeams">, InternalNotFound>> {
    const team = await ctx.db
        .query("tournamentTeams")
        .withIndex("by_tournamentTeamId", (q) => q.eq("tournamentTeamId", teamId))
        .first();

    if (!team) {
        return err(internalNotFound("Team", teamId));
    }
    return ok(team);
}

// ---------------------------------------------------------------------------
// Boundary helper
// ---------------------------------------------------------------------------

/**
 * Unwrap a Result at the Convex handler boundary, throwing an Error if Err.
 * Convex handlers must throw to signal errors to the client.
 */
export function unwrapOrThrow<T>(result: Result<T, InternalError>): T {
    if (result.isOk()) {
        return result.value;
    }
    throw new Error(result.error.message);
}
