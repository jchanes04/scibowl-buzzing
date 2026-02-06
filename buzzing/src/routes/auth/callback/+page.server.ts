import { WorkOS } from '@workos-inc/node';
import { redirect } from '@sveltejs/kit';
import { config } from 'dotenv';
import type { PageServerLoad } from './$types';
import { ResultAsync } from 'neverthrow';
import { externalService } from '$lib/errors';

// Load environment variables from .env file
config();

const workos = new WorkOS(process.env.WORKOS_API_KEY!);

export const load: PageServerLoad = async ({ url, cookies }) => {
    const code = url.searchParams.get('code');
    const errorParam = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    console.log('Callback received:', {
        code: code ? `${code.substring(0, 20)}...` : null,
        error: errorParam,
        errorDescription,
        fullUrl: url.toString()
    });

    if (errorParam) {
        console.error('WorkOS error:', { error: errorParam, errorDescription });
        redirect(302, `/?error=${errorParam}&description=${errorDescription}`);
    }

    if (!code) {
        console.error('No authorization code received');
        redirect(302, '/?error=no_code');
    }

    const authResult = await ResultAsync.fromPromise(
        workos.userManagement.authenticateWithCode({
            code,
            clientId: process.env.WORKOS_CLIENT_ID!,
        }),
        (error) => externalService('WorkOS', error instanceof Error ? error.message : String(error))
    );

    if (authResult.isErr()) {
        console.error('Authentication failed:', authResult.error.message);
        redirect(302, '/?error=auth_failed');
    }

    const authResponse = authResult.value;
    const { user, accessToken } = authResponse;

    console.log('Authentication successful for user:', user.email);

    // Store the access token in a cookie
    cookies.set('workos_access_token', accessToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Store user info in session
    cookies.set('workos_user', JSON.stringify({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.metadata?.username || null,
        school: user.metadata?.school || null,
    }), {
        path: '/',
        httpOnly: false, // Allow client-side access for auth store
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Check if user has a persistentMemberId cookie (from previous anonymous games)
    const persistentMemberId = cookies.get('persistentMemberId');
    if (persistentMemberId && persistentMemberId !== user.id) {
        // Set a temporary cookie to trigger the account linking modal on the client
        cookies.set('pendingAccountLink', JSON.stringify({
            oldMemberId: persistentMemberId,
            newMemberId: user.id
        }), {
            path: '/',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 5 // 5 minutes - just needs to survive the redirect
        });
    }

    redirect(302, '/?success=authenticated');
};
