import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async function({ locals }) {
    if (locals.user?.admin) {
        return {}
    } else {
        throw redirect(302, "/")
    }
}