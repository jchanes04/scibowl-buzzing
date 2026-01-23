import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { getConvexClient, api } from "$lib/convex.server";

export const load: PageServerLoad = async ({ params, cookies }) => {
    const tournamentId = params.id;
    const convex = getConvexClient();

    // Get tournament data
    const tournament = await convex.query(api.tournaments.getById, { tournamentId });
    if (!tournament) {
        error(404, "Tournament not found");
    }

    // Check if current user is the organizer
    let isOrganizer = false;
    let userId: string | null = null;
    const workosUserCookie = cookies.get("workos_user");
    if (workosUserCookie) {
        try {
            const userData = JSON.parse(workosUserCookie);
            userId = userData.id;
            isOrganizer = userData.id === tournament.organizerId;
        } catch {
            // Not authenticated
        }
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
            bracketResults: tournament.bracketResults || [],
            bracketSize: tournament.bracketSize,
            bracketConfirmed: tournament.bracketConfirmed,
            createdAt: tournament.createdAt,
            gameIds: tournament.gameIds || [],
        },
    };
};

