import "$lib/mongo";
import type { Handle } from '@sveltejs/kit';

export const handle = async function({ event, resolve }) {
    // Get user data from cookies and make it available to routes
    const userCookie = event.cookies.get('workos_user');
    const accessToken = event.cookies.get('workos_access_token');

    if (userCookie && accessToken) {
        try {
            const user = JSON.parse(userCookie);
            event.locals.user = user;
            event.locals.accessToken = accessToken;
        } catch (error) {
            console.error('Error parsing user data:', error);
            // Clear invalid cookies
            event.cookies.delete('workos_user', { path: '/' });
            event.cookies.delete('workos_access_token', { path: '/' });
        }
    }

    const response = await resolve(event);
    return response
} satisfies Handle