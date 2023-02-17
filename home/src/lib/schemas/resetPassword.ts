import zod from 'zod'

export const resetPasswordSchema = zod.object({
    newPassword: zod.string().min(5),
    confirmPassword: zod.string().min(5),
    code: zod.string()
})