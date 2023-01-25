import type { LayoutServerLoad } from "./$types"

export const load = async function({ locals }) {
    const { user } = locals
    return {
        user
    }
} satisfies LayoutServerLoad