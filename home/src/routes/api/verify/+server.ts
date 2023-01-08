import { sendVerificationEmail } from "$lib/mail"
import { generateConfirmationCode } from "$lib/mongo"
import type { RequestHandler } from "./$types"

export const POST = async function({ locals, request }) {
    if (!locals.user?.admin) {
        return new Response(null, {
            status: 403,
            statusText: "Unauthorized"
        })
    }

    const { userId } = await request.json()
    const code = await generateConfirmationCode(userId)

    await sendVerificationEmail(locals.user.email, code)
    return new Response(null, {
        status: 200
    })
} satisfies RequestHandler