import type { LayoutServerLoad } from "./$types";

export const load = async function({ locals }) {
    return {
        user: locals.user
    }
} satisfies LayoutServerLoad