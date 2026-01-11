import { WorkOS } from '@workos-inc/node';
import { json, error } from '@sveltejs/kit';
import { config } from 'dotenv';
import type { RequestHandler } from './$types';

// Load environment variables from .env file
config();

const workos = new WorkOS(process.env.WORKOS_API_KEY!);

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        // Get the access token from cookies
        const accessToken = cookies.get('workos_access_token');

        if (!accessToken) {
            throw error(401, 'Not authenticated');
        }

        // Get user ID from cookies
        const userCookie = cookies.get('workos_user');
        if (!userCookie) {
            throw error(401, 'User data not found');
        }

        const userData = JSON.parse(userCookie);
        console.log('User data from cookie:', JSON.stringify(userData, null, 2));
        const userId = userData.id;
        console.log('Extracted userId:', userId);

        // Parse request body
        const { firstName, lastName, username, school } = await request.json();

        // Validate required fields
        if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
            throw error(400, 'First name is required');
        }
        if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
            throw error(400, 'Last name is required');
        }

        // Prepare metadata update
        const metadata = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            username: username?.trim() || null,
            school: school?.trim() || null,
        };

        // Update user metadata in WorkOS
        const updatedUser = await workos.userManagement.updateUser(
            {
                userId: userId,
                firstName: metadata.firstName || undefined,
                lastName: metadata.lastName || undefined,
                metadata: {
                    username: metadata.username || undefined,
                    school: metadata.school || undefined,
                } as any,
            }
        );

        // Update the cookie with new user data
        const updatedUserData = {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            username: metadata.username,
            school: metadata.school,
        };

        cookies.set('workos_user', JSON.stringify(updatedUserData), {
            path: '/',
            httpOnly: false, // Allow client-side access for auth store
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return json(updatedUserData);

    } catch (err: any) {
        console.error('Error updating profile:', err);

        if (err.status) {
            throw err; // Re-throw SvelteKit errors
        }

        throw error(500, 'Failed to update profile');
    }
};
