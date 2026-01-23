import type { PageServerLoad, Actions } from "./$types";
import { error, fail, redirect } from "@sveltejs/kit";
import { getConvexClient, api } from "$lib/convex.server";
import { createTeamID } from "$lib/functions/createId";

export const load: PageServerLoad = async ({ params, cookies, url }) => {
    const tournamentId = params.id;
    const editTeamId = url.searchParams.get("edit");
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

    // Get user's registered teams
    let userTeams: { teamId: string; name: string; players: string[] }[] = [];
    let editingTeam: { teamId: string; name: string; players: string[] } | null = null;

    if (userId) {
        userTeams = await convex.query(api.tournaments.getTeamsByUser, {
            tournamentId,
            userId,
        });

        // If editing a specific team, get its data
        if (editTeamId) {
            const team = await convex.query(api.tournaments.getTeamById, { teamId: editTeamId });
            if (team && team.registeredBy === userId) {
                editingTeam = {
                    teamId: team.teamId,
                    name: team.name,
                    players: team.players,
                };
            }
        }
    }

    return {
        tournament: {
            id: tournament.tournamentId,
            name: tournament.name,
            settings: tournament.settings,
            bracketConfirmed: tournament.bracketConfirmed,
        },
        isAuthenticated: !!userId,
        userId,
        userTeams,
        editingTeam,
    };
};

export const actions = {
    register: async function ({ request, cookies, params }) {
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

        if (tournament.bracketConfirmed) {
            return fail(400, { message: "Registration is closed - the bracket has been confirmed" });
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

    update: async function ({ request, cookies, params }) {
        const tournamentId = params.id;

        // Check authentication
        const workosUserCookie = cookies.get("workos_user");
        if (!workosUserCookie) {
            return fail(401, { message: "You must be logged in to update a team" });
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

        if (tournament.bracketConfirmed) {
            return fail(400, { message: "Cannot edit teams - the bracket has been confirmed" });
        }

        const body = await request.formData();
        const teamId = body.get("team-id") as string;
        const teamName = body.get("team-name") as string;
        const playersJson = body.get("players") as string;

        if (!teamId) {
            return fail(400, { message: "Team ID is required" });
        }

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

        try {
            await convex.mutation(api.tournaments.updateTeam, {
                teamId,
                name: teamName.trim(),
                players: players.filter(p => p.trim()),
                userId,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to update team";
            return fail(400, { message });
        }

        redirect(302, `/tournament/${tournamentId}`);
    },
} satisfies Actions;
