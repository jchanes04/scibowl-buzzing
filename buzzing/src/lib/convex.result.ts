/**
 * Type-safe wrappers around Convex client calls that return Result types
 * instead of throwing exceptions.
 */
import { ok, err, type Result } from "neverthrow";
import type { ConvexHttpClient } from "convex/browser";
import type {
    FunctionReference,
    FunctionReturnType,
    OptionalRestArgs,
} from "convex/server";
import {
    convexError,
    notFound,
    businessRule,
    forbidden,
    type AppError,
    type ConvexError,
} from "./errors";

/**
 * Wraps `client.query()` in a try/catch, returning `Result<T, ConvexError>`.
 */
export async function safeQuery<Query extends FunctionReference<"query">>(
    client: ConvexHttpClient,
    fn: Query,
    ...args: OptionalRestArgs<Query>
): Promise<Result<FunctionReturnType<Query>, ConvexError>> {
    try {
        const result = await client.query(fn, ...args);
        return ok(result);
    } catch (error) {
        return err(convexError(error));
    }
}

/**
 * Wraps `client.mutation()` in a try/catch, returning `Result<T, ConvexError>`.
 */
export async function safeMutation<Mutation extends FunctionReference<"mutation">>(
    client: ConvexHttpClient,
    fn: Mutation,
    ...args: OptionalRestArgs<Mutation>
): Promise<Result<FunctionReturnType<Mutation>, ConvexError>> {
    try {
        const result = await client.mutation(fn, ...args);
        return ok(result);
    } catch (error) {
        return err(convexError(error));
    }
}

/**
 * Inspects a ConvexError's message to produce a more specific AppError.
 *
 * Convex throws plain `Error` objects with messages like
 * "Tournament not found: abc123" or "Cannot edit teams after the bracket has
 * been confirmed". This function pattern-matches those messages so callers
 * get a narrower error type.
 */
export function refineConvexError(error: ConvexError): AppError {
    const msg = error.message.toLowerCase();

    if (msg.includes("not found")) {
        return notFound("entity", error.message);
    }
    if (
        msg.includes("cannot") ||
        msg.includes("already confirmed") ||
        msg.includes("must have at least") ||
        msg.includes("cannot have more than") ||
        msg.includes("must be assigned") ||
        msg.includes("bracket size must") ||
        msg.includes("require a power of 2")
    ) {
        return businessRule("constraint", error.message);
    }
    if (msg.includes("you can only") || msg.includes("not authorized")) {
        return forbidden(error.message);
    }

    return error;
}
