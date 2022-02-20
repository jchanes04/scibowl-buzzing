export function redirectTo(location: string) {
    return new Response(null, {
        headers: {
            'Location': location
        },
        status: 302
    })
}