import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
    console.log('User logging out');

    // Clear authentication cookies
    cookies.delete('workos_access_token', { path: '/' });
    cookies.delete('workos_user', { path: '/' });

    console.log('Authentication cookies cleared, redirecting to home');

    // Redirect to home page with logout message
    throw redirect(302, '/?logout=success');
};
