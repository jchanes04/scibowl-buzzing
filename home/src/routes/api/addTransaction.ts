import { addTransaction } from "$lib/mongo";
import type { RequestEvent } from "@sveltejs/kit";

export async function get({ url }: RequestEvent) {
    const transactionID = parseInt(url.searchParams.get('transactionID'))
    const userID = url.searchParams.get('userID')
    const amount = parseFloat(url.searchParams.get('amount'))
    console.log(amount,transactionID,userID)
    let res = await addTransaction(amount,transactionID,userID)
    return new Response(JSON.stringify(res))
}