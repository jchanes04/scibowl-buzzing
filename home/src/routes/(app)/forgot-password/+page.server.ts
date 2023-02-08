import { sendPasswordResetEmail } from "$lib/mail"
import { generatePasswordResetCode, getUserFromEmail } from "$lib/mongo"
import type { Actions } from "./$types"

export const actions = {
    default: async function({ request }) {
        const data = await request.formData()
        const email = data.get('email') as string

        if (typeof email !== "string") {
            return { sent: true }
        }

        const user = await getUserFromEmail(email)
        if (!user) return { sent: true }
        
        const code = await generatePasswordResetCode(user._id)
        await sendPasswordResetEmail(email, code)

        return { sent: true }        
    }
} satisfies Actions