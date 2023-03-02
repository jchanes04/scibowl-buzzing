import type { Handle } from '@sveltejs/kit';

export const handle = async function({ event, resolve }) {
    console.log("handling")
    const response = await resolve(event);
    return response
} satisfies Handle