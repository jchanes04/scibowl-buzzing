import { redirect, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { getConvexClient, api } from "$lib/convex.server";
import { safeMutation } from "$lib/convex.result";
import { getAuthenticatedUser } from "$lib/auth.result";
import { createTournamentID } from "$lib/functions/createId";
import { failFromError } from "$lib/sveltekit.result";

export const load: PageServerLoad = async ({ cookies }) => {
    const userResult = getAuthenticatedUser(cookies);
    if (userResult.isErr()) {
        return { authenticated: false };
    }
    return { authenticated: true, userId: userResult.value.id };
};

export const actions = {
    default: async function ({ request, cookies }) {
        const userResult = getAuthenticatedUser(cookies);
        if (userResult.isErr()) {
            return failFromError(userResult.error);
        }
        const organizerId = userResult.value.id;

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

        const mutationResult = await safeMutation(convex, api.tournaments.create, {
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
        });

        if (mutationResult.isErr()) {
            return failFromError(mutationResult.error);
        }

        redirect(302, `/tournament/${tournamentId}`);
    },
} satisfies Actions;
