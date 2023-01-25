import { env as privateEnv } from '$env/dynamic/private'
import { env as publicEnv } from '$env/dynamic/public';
import Stripe from 'stripe'
const stripe = new Stripe(privateEnv.STRIPE_API_KEY, {
    apiVersion: "2022-11-15"
})

export async function createCheckoutSession(quantity: number = 1) {
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                price: privateEnv.REGISTRATION_PRICE_ID,
                quantity,
            },
        ],
        mode: 'payment',
        success_url: `${publicEnv.PUBLIC_HOST_URL}/edit?status=paymentSuccess`,
        cancel_url: `${publicEnv.PUBLIC_HOST_URL}/edit?status=paymentCancelled`,
        automatic_tax: {enabled: true},
    });

    return session
}