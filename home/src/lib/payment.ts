import { env as privateEnv } from '$env/dynamic/private'
import { env as publicEnv } from '$env/dynamic/public';
import Stripe from 'stripe'
const stripe = new Stripe(privateEnv.STRIPE_API_KEY, {
    apiVersion: "2022-11-15"
})

export async function createCheckoutSession(teamIds: string[]) {
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                price: privateEnv.REGISTRATION_PRICE_ID,
                quantity: teamIds.length,
            },
        ],
        mode: 'payment',
        success_url: `${publicEnv.PUBLIC_HOST_URL}/api/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${publicEnv.PUBLIC_HOST_URL}/edit`,
        automatic_tax: {enabled: true},
        metadata: {
            teamIds: teamIds.join(",")
        }
    });

    return session
}

export async function getTransactionTeams(sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (!session?.metadata) return null

    const { teamIds } = session.metadata
    return (teamIds || "").split(",")
}