import { createCheckoutSession } from "$lib/payment"
import { redirect } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"

export const POST = async function({ request }) {
    const data = await request.formData()
    const teamIds = data.getAll('payment-teams') as string[]
    if (!teamIds?.length) throw redirect(302, "/edit?status=paymentFailed")

    const session = await createCheckoutSession(teamIds)

    throw redirect(303, session.url || "/edit?status=paymentFailed")
} satisfies RequestHandler