/**
 * Helpers for mapping AppError → SvelteKit responses.
 */
import { fail, error } from "@sveltejs/kit";
import type { Result } from "neverthrow";
import type { AppError } from "./errors";

/**
 * Map an AppError to an HTTP status code.
 */
function statusCode(appError: AppError): number {
    switch (appError.type) {
        case "NotFoundError":
            return 404;
        case "ValidationError":
            return 400;
        case "AuthError":
            return 401;
        case "ForbiddenError":
            return 403;
        case "BusinessRuleError":
            return 422;
        case "ConvexError":
            return 500;
        case "ExternalServiceError":
            return 502;
    }
}

/**
 * Maps an AppError to a SvelteKit `fail()` response for form actions.
 */
export function failFromError(appError: AppError) {
    return fail(statusCode(appError), { message: appError.message });
}

/**
 * Maps an AppError to a SvelteKit `error()` throw for load functions.
 * This function always throws.
 */
export function throwHttpError(appError: AppError): never {
    error(statusCode(appError), appError.message);
}

/**
 * Unwraps a Result or throws a SvelteKit error.
 * Use in load functions where you want to stop execution on error.
 */
export function unwrapOrHttpError<T>(result: Result<T, AppError>): T {
    if (result.isOk()) {
        return result.value;
    }
    throwHttpError(result.error);
}
