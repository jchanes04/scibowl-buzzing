import { resetPassword } from "$lib/mongo"
import { resetPasswordSchema } from "$lib/schemas/resetPassword"
import { fail, redirect } from "@sveltejs/kit"
import type { Actions } from "./$types"

export const actions = {
    default: async function({ request, url }) {
        const data = await request.formData()
        const newPassword = data.get('new-password') as string
        const confirmPassword = data.get('confirm-password') as string
        const code = url.searchParams.get('code')
        console.log(code)
        
        const parseResult = resetPasswordSchema.safeParse({
            newPassword,
            confirmPassword,
            code
        })

        if (!parseResult.success || newPassword !== confirmPassword) {
            return fail(400, { message: "Invalid data" })
        }

        const resetSuccess = await resetPassword(parseResult.data.code, parseResult.data.newPassword)
        if (resetSuccess) {
            throw redirect(302, "/")
        } else {
            return fail(400, { message: "Invalid data" })
        }
    }
} satisfies Actions