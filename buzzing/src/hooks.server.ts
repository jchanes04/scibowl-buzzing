import "$lib/mongo";
import type { Handle } from '@sveltejs/kit';

export const handle = async function({ event, resolve }) {
    const response = await resolve(event);
    return response
} satisfies Handle