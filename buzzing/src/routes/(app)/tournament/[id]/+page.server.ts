import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { getConvexClient, api } from "$lib/convex.server";
import { safeQuery } from "$lib/convex.result";
import { getAuthenticatedUser } from "$lib/auth.result";
import { notFound } from "$lib/errors";
import { throwHttpError } from "$lib/sveltekit.result";

export const load: PageServerLoad = async ({ params, cookies }) => {
    const tournamentId = params.id;
    const convex = getConvexClient();

    // Get tournament data
    const queryResult = await safeQuery(convex, api.tournaments.getById, { tournamentId });
    if (queryResult.isErr()) {
        throwHttpError(notFound("Tournament", tournamentId));
    }
    const tournament = queryResult.value;
    if (!tournament) {
        error(404, "Tournament not found");
    }

    // Check if current user is the organizer
    let isOrganizer = false;
    let userId: string | null = null;
    const userResult = getAuthenticatedUser(cookies);
    if (userResult.isOk()) {
        userId = userResult.value.id;
        isOrganizer = userResult.value.id === tournament.organizerId;
    }

    return {
        tournamentId,
        isOrganizer,
        userId,
        initialTournament: {
            id: tournament.tournamentId,
            name: tournament.name,
            settings: tournament.settings,
            bracketSeeds: tournament.bracketSeeds || [],
            bracket: tournament.bracket ? {
                gameIds: tournament.bracket.gameIds || [],
                results: tournament.bracket.results || [],
            } : undefined,
            bracketSize: tournament.bracketSize,
            bracketConfirmed: tournament.bracketConfirmed,
            createdAt: tournament.createdAt,
        },
    };
};
