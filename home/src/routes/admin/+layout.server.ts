import { getAllTeams, getAllUsers } from "$lib/mongo";
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async function({ locals }) {
    const users = await getAllUsers()
    const teams = await getAllTeams()
    if (locals.user?.admin) {
        return {
            users, teams
        }
    } else {
        throw redirect(302, "/")
    }
}