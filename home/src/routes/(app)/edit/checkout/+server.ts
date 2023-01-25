import { createCheckoutSession } from "$lib/payment"
import { redirect } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"

export const GET = async function() {
    const session = await createCheckoutSession()

    throw redirect(303, session.url)
} satisfies RequestHandler