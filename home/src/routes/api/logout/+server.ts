import { RequestHandler } from "./$types"

export async function GET() {
    return new Response(null, {
        headers: {
            'Location': '/',
            'Set-cookie': 'authToken=;HttpOnly;Path=/'
        },
        status: 302
    })
} satisfies RequestHandler