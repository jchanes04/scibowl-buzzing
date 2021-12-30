import type { Request } from "@sveltejs/kit";
import { updateNameOnQuestions, updateUser, User } from "../../mongo";
import { getIDFromToken } from "../../authentication";
import type { ReadOnlyFormData } from "@sveltejs/kit/types/helper";

export async function post({ body, headers }: Request) {
    const authToken = headers.authorization
    const userId = getIDFromToken(authToken)
    const formData = <ReadOnlyFormData>body
    const username = formData.get('username')
    
    if (username) {
        await updateUser(userId, { username: username.trim() })
        await updateNameOnQuestions(userId, username.trim())

        return {
            status: 200,
            body: {
                user: {
                    id: userId,
                    username: username.trim()
                } as Partial<User>
            }
        }
    }
}