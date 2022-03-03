
import { getTransactionsFromUser } from '$lib/mongo'
import type { RequestEvent } from '@sveltejs/kit'

export async function get({ url }: RequestEvent) {
    const transactionID = parseInt(url.searchParams.get('transactionID'))
    const userID = url.searchParams.get('userID')
    console.log(transactionID)
    const transactions = await getTransactionsFromUser(userID)
    const repeat = transactions.find(e=>e==transactionID)
    return new Response(JSON.stringify({ repeat }))
}
