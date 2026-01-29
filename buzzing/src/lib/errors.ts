/**
 * Discriminated union of application error types.
 *
 * Every error carries a `type` tag so callers can narrow with a simple
 * switch/match. Factory functions provide convenient constructors.
 */

// ---------------------------------------------------------------------------
// Error type definitions
// ---------------------------------------------------------------------------

export interface NotFoundError {
    readonly type: "NotFoundError";
    readonly entity: string;
    readonly id?: string;
    readonly message: string;
}

export interface ValidationError {
    readonly type: "ValidationError";
    readonly field?: string;
    readonly message: string;
}

export interface AuthError {
    readonly type: "AuthError";
    readonly message: string;
}

export interface ForbiddenError {
    readonly type: "ForbiddenError";
    readonly message: string;
}

export interface BusinessRuleError {
    readonly type: "BusinessRuleError";
    readonly rule: string;
    readonly message: string;
}

export interface ConvexError {
    readonly type: "ConvexError";
    readonly originalError: unknown;
    readonly message: string;
}

export interface ExternalServiceError {
    readonly type: "ExternalServiceError";
    readonly service: string;
    readonly message: string;
}

export type AppError =
    | NotFoundError
    | ValidationError
    | AuthError
    | ForbiddenError
    | BusinessRuleError
    | ConvexError
    | ExternalServiceError;

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

export function notFound(entity: string, id?: string): NotFoundError {
    return {
        type: "NotFoundError",
        entity,
        id,
        message: id ? `${entity} not found: ${id}` : `${entity} not found`,
    };
}

export function validation(message: string, field?: string): ValidationError {
    return { type: "ValidationError", field, message };
}

export function authError(message: string = "Not authenticated"): AuthError {
    return { type: "AuthError", message };
}

export function forbidden(message: string = "Not authorized"): ForbiddenError {
    return { type: "ForbiddenError", message };
}

export function businessRule(rule: string, message: string): BusinessRuleError {
    return { type: "BusinessRuleError", rule, message };
}

export function convexError(originalError: unknown): ConvexError {
    const message =
        originalError instanceof Error
            ? originalError.message
            : String(originalError);
    return { type: "ConvexError", originalError, message };
}

export function externalService(service: string, message: string): ExternalServiceError {
    return { type: "ExternalServiceError", service, message };
}
