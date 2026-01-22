import { redirect, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { getConvexClient, api } from "$lib/convex.server";
import { createTournamentID } from "$lib/functions/createId";

export const load: PageServerLoad = async ({ cookies }) => {
    // Check if user is logged in
    const workosUserCookie = cookies.get("workos_user");
    if (!workosUserCookie) {
        return { authenticated: false };
    }

    try {
        const userData = JSON.parse(workosUserCookie);
        return { authenticated: true, userId: userData.id };
    } catch {
        return { authenticated: false };
    }
};

export const actions = {
    default: async function ({ request, cookies }) {
        const workosUserCookie = cookies.get("workos_user");
        if (!workosUserCookie) {
            return fail(401, { message: "You must be logged in to create a tournament" });
        }

        let organizerId: string;
        try {
            const userData = JSON.parse(workosUserCookie);
            organizerId = userData.id;
        } catch {
            return fail(401, { message: "Invalid session" });
        }

        const body = await request.formData();
        const tournamentName = body.get("tournament-name") as string;

        if (!tournamentName?.trim()) {
            return fail(400, { message: "Tournament name is required" });
        }

        // Extract settings
        const spectatorsAllowed = body.get("spectators-allowed") === "on";
        const tossupTime = parseInt(body.get("tossup-time") as string) || 5;
        const bonusTime = parseInt(body.get("bonus-time") as string) || 20;
        const visualTime = parseInt(body.get("visual-time") as string) || 30;
        const tossupPoints = parseInt(body.get("tossup-points") as string) || 4;
        const bonusPoints = parseInt(body.get("bonus-points") as string) || 10;
        const penaltyPoints = parseInt(body.get("penalty-points") as string) || -4;
        const minPlayers = parseInt(body.get("min-players") as string) || 1;
        const maxPlayers = parseInt(body.get("max-players") as string) || 5;

        // Generate tournament ID
        const tournamentId = createTournamentID();

        const times = {
            tossup: [tossupTime, 2],
            bonus: [bonusTime, 2],
            visual: [visualTime, 2],
        };

        const pointValues = {
            tossup: tossupPoints,
            bonus: bonusPoints,
            penalty: penaltyPoints,
        };

        const convex = getConvexClient();

        // Create the tournament WITHOUT games
        // Games will be created when the organizer confirms the bracket structure
        await convex.mutation(api.tournaments.create, {
            tournamentId,
            name: tournamentName.trim(),
            organizerId,
            settings: {
                spectatorsAllowed,
                times: times as { tossup: number[]; bonus: number[]; visual: number[] },
                pointValues,
                minPlayers,
                maxPlayers,
            },
            gameIds: [], // No games created yet - will be created on bracket confirmation
        });

        redirect(302, `/tournament/${tournamentId}`);
    },
} satisfies Actions;
