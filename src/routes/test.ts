import { createMemberID } from "$lib/functions/createId"

export async function get() {
    return {
        headers: {
            'Content-Type': "text/html"
        },
        body: `<h1>${createMemberID()}</h1>`
    }
}