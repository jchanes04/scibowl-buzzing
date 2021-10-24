export function redirectTo(location: string) {
    return {
        headers: {
            'Location': location
        },
        status: 302
    }
}