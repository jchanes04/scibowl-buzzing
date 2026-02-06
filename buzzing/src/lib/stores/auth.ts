import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { User } from '$lib/auth.result';
export type { User };

export const user = writable<User | null>(null);
export const isAuthenticated = writable<boolean>(false);

// Initialize user state from cookies on client side
if (browser) {
    const userCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('workos_user='))
        ?.split('=')[1];

    if (userCookie) {
        try {
            const userData = JSON.parse(decodeURIComponent(userCookie));
            user.set(userData);
            isAuthenticated.set(true);
        } catch (error) {
            console.error('Error parsing user cookie:', error);
        }
    }
}

// Helper function to check if user is authenticated
export function getIsAuthenticated(): boolean {
    let authenticated = false;
    isAuthenticated.subscribe(value => authenticated = value)();
    return authenticated;
}

// Helper function to get current user
export function getCurrentUser(): User | null {
    let currentUser: User | null = null;
    user.subscribe(value => currentUser = value)();
    return currentUser;
}
