import type { Request } from "@sveltejs/kit";
import { updateNameOnQuestions, updateUser, User } from "../../mongo";
import { getIDFromToken } from "../../authentication";
import type { ReadOnlyFormData } from "@sveltejs/kit/types/helper";

export async function post({ body, headers }: Request) {
    let authToken = headers.authorization
    let userId = getIDFromToken(authToken)
    let formData = <ReadOnlyFormData>body
    let username = formData.get('username')
    
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