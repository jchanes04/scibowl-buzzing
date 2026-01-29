/**
 * Result-based fetch wrapper for client-side API calls.
 */
import { ResultAsync } from "neverthrow";
import { externalService, type ExternalServiceError } from "./errors";

/**
 * Wraps the global `fetch()` in a `ResultAsync`.
 *
 * - Network errors become `ExternalServiceError`.
 * - Non-ok responses are also mapped to `ExternalServiceError` with the
 *   response status text and body (when available).
 */
export function safeFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
): ResultAsync<Response, ExternalServiceError> {
    return ResultAsync.fromPromise(
        fetch(input, init).then(async (response) => {
            if (!response.ok) {
                let body = "";
                try {
                    const json = await response.clone().json();
                    body = json.message || json.error || response.statusText;
                } catch {
                    body = response.statusText;
                }
                throw externalService(
                    "fetch",
                    `${response.status}: ${body}`,
                );
            }
            return response;
        }),
        (error) => {
            if (
                typeof error === "object" &&
                error !== null &&
                "type" in error &&
                (error as any).type === "ExternalServiceError"
            ) {
                return error as ExternalServiceError;
            }
            return externalService(
                "fetch",
                error instanceof Error ? error.message : String(error),
            );
        },
    );
}
