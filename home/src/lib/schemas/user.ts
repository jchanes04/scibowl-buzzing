import zod from 'zod'

export const userSchema = zod.object({
    schoolName: zod.string().min(5).max(80),
    email: zod.string().min(10).max(50),
    secondaryEmail: zod.string().max(50).optional(),
    password: zod.string().min(5)
})