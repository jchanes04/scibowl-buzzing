import type { PageServerLoad, Actions } from "./$types";
import { error, fail, redirect } from "@sveltejs/kit";
import { getConvexClient, api } from "$lib/convex.server";
import { createTeamID } from "$lib/functions/createId";

export const load: PageServerLoad = async ({ params, cookies }) => {
    const tournamentId = params.id;
    const convex = getConvexClient();

    // Get tournament data
    const tournament = await convex.query(api.tournaments.getById, { tournamentId });
    if (!tournament) {
        error(404, "Tournament not found");
    }

    // Check if user is logged in
    let userId: string | null = null;
    const workosUserCookie = cookies.get("workos_user");
    if (workosUserCookie) {
        try {
            const userData = JSON.parse(workosUserCookie);
            userId = userData.id;
        } catch {
            // Not authenticated
        }
    }

    return {
        tournament: {
            id: tournament.tournamentId,
            name: tournament.name,
            settings: tournament.settings,
        },
        isAuthenticated: !!userId,
        userId,
    };
};

export const actions = {
    default: async function ({ request, cookies, params }) {
        const tournamentId = params.id;

        // Check authentication
        const workosUserCookie = cookies.get("workos_user");
        if (!workosUserCookie) {
            return fail(401, { message: "You must be logged in to register a team" });
        }

        let userId: string;
        try {
            const userData = JSON.parse(workosUserCookie);
            userId = userData.id;
        } catch {
            return fail(401, { message: "Invalid session" });
        }

        const convex = getConvexClient();

        // Verify tournament exists
        const tournament = await convex.query(api.tournaments.getById, { tournamentId });
        if (!tournament) {
            return fail(404, { message: "Tournament not found" });
        }

        const body = await request.formData();
        const teamName = body.get("team-name") as string;
        const playersJson = body.get("players") as string;

        if (!teamName?.trim()) {
            return fail(400, { message: "Team name is required" });
        }

        let players: string[];
        try {
            players = JSON.parse(playersJson || "[]");
        } catch {
            players = [];
        }

        // Validate player count
        const minPlayers = tournament.settings?.minPlayers ?? 1;
        const maxPlayers = tournament.settings?.maxPlayers ?? 10;
        if (players.length < minPlayers) {
            return fail(400, {
                message: `Team must have at least ${minPlayers} players`
            });
        }
        if (players.length > maxPlayers) {
            return fail(400, {
                message: `Team cannot have more than ${maxPlayers} players`
            });
        }

        // Generate team ID and register
        const teamId = createTeamID();

        await convex.mutation(api.tournaments.registerTeam, {
            tournamentId,
            teamId,
            name: teamName.trim(),
            players: players.filter(p => p.trim()),
            registeredBy: userId,
        });

        redirect(302, `/tournament/${tournamentId}`);
    },
} satisfies Actions;
