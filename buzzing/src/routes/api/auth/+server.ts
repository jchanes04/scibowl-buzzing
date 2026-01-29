import { WorkOS } from '@workos-inc/node';
import { json } from '@sveltejs/kit';
import { config } from 'dotenv';
import type { RequestHandler } from './$types';
import { ok, err, type Result } from 'neverthrow';
import { externalService, type ExternalServiceError } from '$lib/errors';

// Load environment variables from .env file
config();

const workos = new WorkOS(process.env.WORKOS_API_KEY!);

export const GET: RequestHandler = async () => {
    if (!workos) {
        console.error('WorkOS not initialized - missing API key');
        return json({ error: 'WorkOS not configured' }, { status: 500 });
    }

    let result: Result<string, ExternalServiceError>;
    try {
        const urlOrPromise = workos.userManagement.getAuthorizationUrl({
            provider: 'authkit',
            redirectUri: process.env.PUBLIC_WORKOS_REDIRECT_URI || '',
            clientId: process.env.WORKOS_CLIENT_ID!,
        });
        const url = typeof urlOrPromise === 'string' ? urlOrPromise : await urlOrPromise;
        result = ok(url);
    } catch (error) {
        result = err(externalService('WorkOS', error instanceof Error ? error.message : String(error)));
    }

    if (result.isErr()) {
        console.error('Error generating authorization URL:', result.error.message);
        return json({ error: 'Failed to generate authorization URL' }, { status: 500 });
    }

    return json({ authorizationUrl: result.value });
};
