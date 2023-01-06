import { getUserFromToken } from "$lib/authentication";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async function({ cookies }) {
    const authToken = cookies.get('authToken')
    const user = await getUserFromToken(authToken)

    return { userData: user ||  }
}