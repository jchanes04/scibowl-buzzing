import { getGameFromCode } from "$lib/server"
import { fail, redirect } from "@sveltejs/kit"
import type { Actions } from "./$types"

export const actions = {
    default: async function({ request }) {
        const body = await request.formData()
        const joinCode = body.get('join-code') as string

        const game = getGameFromCode(joinCode)

        if (joinCode && game) {
            throw redirect(302, "/join/" + game.id + "?code=" + game.joinCode)
        } else {
            return fail(400, { error: "Invalid code" })
        }
    }
} satisfies Actions