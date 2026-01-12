import { WorkOS } from '@workos-inc/node';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Load environment variables from .env file

const workos = new WorkOS(env.WORKOS_API_KEY);

export const GET: RequestHandler = async () => {
    if (!workos) {
        console.error('WorkOS not initialized - missing API key');
        return json({ error: 'WorkOS not configured' }, { status: 500 });
    }

    try {
        const authorizationUrl = await workos.userManagement.getAuthorizationUrl({
            provider: 'authkit',
            redirectUri: env.WORKOS_REDIRECT_URI,
            clientId: env.WORKOS_CLIENT_ID,
        });

        return json({ authorizationUrl });
    } catch (error) {
        console.error('Error generating authorization URL:', error);
        return json({ error: 'Failed to generate authorization URL' }, { status: 500 });
    }
};
