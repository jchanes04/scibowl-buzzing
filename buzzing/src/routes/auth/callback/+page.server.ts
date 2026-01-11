import { WorkOS } from '@workos-inc/node';
import { redirect } from '@sveltejs/kit';
import { config } from 'dotenv';
import type { PageServerLoad } from './$types';

// Load environment variables from .env file
config();

const workos = new WorkOS(process.env.WORKOS_API_KEY!);

export const load: PageServerLoad = async ({ url, cookies }) => {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    console.log('Callback received:', {
        code: code ? `${code.substring(0, 20)}...` : null,
        error,
        errorDescription,
        fullUrl: url.toString()
    });

    if (error) {
        console.error('WorkOS error:', { error, errorDescription });
        throw redirect(302, `/?error=${error}&description=${errorDescription}`);
    }

    if (!code) {
        console.error('No authorization code received');
        throw redirect(302, '/?error=no_code');
    }

    try {
        console.log('Attempting to authenticate with code...');
        const authResponse = await workos.userManagement.authenticateWithCode({
            code,
            clientId: process.env.WORKOS_CLIENT_ID!,
        });
        const { user } = authResponse;
        const access_token = (authResponse as any).accessToken || (authResponse as any).access_token;

        console.log('Authentication successful for user:', user.email);
        console.log('User object:', JSON.stringify(user, null, 2));

        // Store the access token in a cookie (you might want to use a more secure method)
        cookies.set('workos_access_token', (user as any).accessToken || access_token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        // Store user info in session (you might want to store this in a database)
        cookies.set('workos_user', JSON.stringify({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            username: (user as any).rawAttributes?.username || null,
            school: (user as any).rawAttributes?.school || null,
        }), {
            path: '/',
            httpOnly: false, // Allow client-side access for auth store
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        console.log('Redirecting to home page after successful authentication');
        // Redirect to dashboard or home page
        throw redirect(302, '/?success=authenticated');

    } catch (error: any) {
        // Check if this is a redirect (which is expected behavior)
        if (error?.status >= 300 && error?.status < 400 && error?.location) {
            console.log('Redirect handled:', error.location);
            throw error; // Re-throw redirects
        }

        console.error('Authentication failed with error:', error);
        throw redirect(302, '/?error=auth_failed');
    }
};
