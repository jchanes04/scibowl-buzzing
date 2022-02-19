export async function get() {
    return new Response(null, {
        headers: {
            'Location': '/',
            'Set-cookie': 'authToken=;HttpOnly;Path=/'
        },
        status: 302
    })
}