import { getTransactionsFromUser, getUserFromSchoolName } from '$lib/mongo'
import type { RequestEvent } from '@sveltejs/kit'

export async function get({ url }: RequestEvent) {
    const transactionID = parseInt(url.searchParams.get('transactionID'))
    const userID = url.searchParams.get('userID')
    console.log(transactionID)
    const transactions = await getTransactionsFromUser(userID)
    return new Response(JSON.stringify({ taken:transactions.find(e=>e==transactionID) }))
}