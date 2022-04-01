import { getTransactionsFromUser } from '$lib/mongo'
import type { RequestEvent } from '@sveltejs/kit'

export async function get({ url, locals }: RequestEvent) {
    const transactionID = url.searchParams.get('transactionID')
    const transactions = await getTransactionsFromUser(locals.userData.id)
    const repeat = !!(transactions?.some(e => e.transactionID == transactionID))
    return new Response(JSON.stringify({ repeat }))
}
