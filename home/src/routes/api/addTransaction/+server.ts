import { addTransaction } from "$lib/mongo";
import type { RequestHandler } from "./$types"

export const GET = async function({ url, locals }) {
    const transactionID = url.searchParams.get('transactionID')
    const paymentEmail = url.searchParams.get('paymentEmail')
    const amount = parseFloat(url.searchParams.get('amount'))
    console.log(amount, transactionID, locals.userData.id)
    let res = await addTransaction(locals.userData.id, amount, transactionID, paymentEmail)
    return new Response(JSON.stringify(res))
} satisfies RequestHandler