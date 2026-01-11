<script lang="ts">
    import { isAuthenticated, user, type User } from "$lib/stores/auth";

    let authenticated = $state(false);
    let currentUser = $state<User | null>(null);

    // Subscribe to auth state
    $effect(() => {
        const unsubscribeUser = user.subscribe(value => currentUser = value);
        const unsubscribeAuth = isAuthenticated.subscribe(value => authenticated = value);

        return () => {
            unsubscribeUser();
            unsubscribeAuth();
        };
    });

    import { goto } from '$app/navigation';

    async function handleLogin() {
        try {
            const response = await fetch('/api/auth');
            const data = await response.json();
            if (data.authorizationUrl) {
                window.location.href = data.authorizationUrl;
            }
        } catch (error) {
            console.error('Error starting login:', error);
        }
    }

    function handleProfile() {
        goto('/profile');
    }

</script>

{#if authenticated}
    <button class="login-button user-button" onclick={handleProfile}>
        {currentUser?.firstName || currentUser?.email || 'Profile'}
    </button>
{:else}
    <button class="login-button" onclick={handleLogin}>Login</button>
{/if}

<style lang="scss">
    @use '$styles/_global.scss' as *;

    button {
        @extend %button;
    }

    .login-button {
        font-size: 1.25rem;
        font-weight: 500;
    }

    .user-button {
        font-size: 1.25rem;
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

</style>
