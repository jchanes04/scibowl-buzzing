import { updateTeam } from "$lib/mongo"
import { getTransactionTeams } from "$lib/payment"
import { redirect } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"

export const GET = async function({ url }) {
    const sessionId = url.searchParams.get('session_id') as string
    const teamIds = await getTransactionTeams(sessionId)
    if (!teamIds||!sessionId) throw redirect(302, "/edit?status=paymentFailed")
    
    for (const id of teamIds) {
        await updateTeam(id, { paid: true })
    }

    throw redirect(302, "/edit?status=paymentSuccess")
} satisfies RequestHandler