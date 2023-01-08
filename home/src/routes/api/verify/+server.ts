import { sendVerificationEmail } from "$lib/mail"
import { generateConfirmationCode, getUser } from "$lib/mongo"
import type { RequestHandler } from "./$types"

export const POST = async function({ locals, request }) {
    if (!locals.user?.admin) {
        return new Response(null, {
            status: 403,
            statusText: "Unauthorized"
        })
    }

    const { userId } = await request.json()
    const userData = await getUser(userId)
    const code = await generateConfirmationCode(userId)

    await sendVerificationEmail(userData.email, code)
    return new Response(null, {
        status: 200
    })
} satisfies RequestHandler