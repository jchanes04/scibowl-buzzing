/**
 * Result-based authentication helpers.
 *
 * Replaces the duplicated cookie-parsing pattern found across server files.
 */
import { ok, err, type Result } from "neverthrow";
import { authError, type AuthError } from "./errors";

export interface WorkOSUser {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    school?: string;
}

/**
 * Extract and parse the `workos_user` cookie.
 *
 * Returns `Ok(WorkOSUser)` when the cookie exists and is valid JSON,
 * or `Err(AuthError)` otherwise.
 */
export function getAuthenticatedUser(
    cookies: { get(name: string): string | undefined }
): Result<WorkOSUser, AuthError> {
    const raw = cookies.get("workos_user");
    if (!raw) {
        return err(authError("Not authenticated"));
    }
    try {
        const data = JSON.parse(raw) as WorkOSUser;
        if (!data.id) {
            return err(authError("Invalid session: missing user ID"));
        }
        return ok(data);
    } catch {
        return err(authError("Invalid session cookie"));
    }
}

/**
 * Get the access token from cookies.
 */
export function getAccessToken(
    cookies: { get(name: string): string | undefined }
): Result<string, AuthError> {
    const token = cookies.get("workos_access_token");
    if (!token) {
        return err(authError("Not authenticated"));
    }
    return ok(token);
}
