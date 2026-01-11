<script lang="ts">
    import { user, isAuthenticated, type User } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let authenticated = $state(false);
    let currentUser = $state<User | null>(null);
    let loading = $state(false);
    let success = $state(false);

    // Form fields
    let firstName = $state('');
    let lastName = $state('');
    let username = $state('');
    let school = $state('');

    // Subscribe to auth state
    $effect(() => {
        const unsubscribeUser = user.subscribe(value => {
            currentUser = value;
            if (value) {
                firstName = value.firstName || '';
                lastName = value.lastName || '';
                username = value.username || '';
                school = value.school || '';
            }
        });
        const unsubscribeAuth = isAuthenticated.subscribe(value => authenticated = value);

        return () => {
            unsubscribeUser();
            unsubscribeAuth();
        };
    });

    let submitEnabled = $derived(firstName.trim() && lastName.trim());

    onMount(() => {
        if (!authenticated) {
            goto('/');
        }
    });

    function handleLogout() {
        window.location.href = '/auth/logout';
    }

    async function handleSubmit() {
        loading = true;
        success = false;

        try {
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    username: username.trim(),
                    school: school.trim(),
                }),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                user.set(updatedUser);
                success = true;
                setTimeout(() => success = false, 2000);
            } else {
                const error = await response.json();
                alert(`Error: ${error.message || 'Failed to update profile'}`);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Profile - ESBOT Buzzing</title>
</svelte:head>

{#if authenticated}
    <div class="profile-container">
        <div class="profile-header">
            <h1>Profile Settings</h1>
            <button onclick={handleLogout} class="logout-button">
                Logout
            </button>
        </div>
        <form onsubmit={handleSubmit} class="profile-form">
            <div class="form-grid">
                <!-- Row 1: Email (Full Width) -->
                <div class="form-group full-width">
                    <label for="email-display">Email</label>
                    <div id="email-display" class="email-text">
                        {currentUser?.email || ''}
                    </div>
                </div>

                <!-- Row 2: Names -->
                <div class="form-group">
                    <label for="firstName">First Name <span class="required">*</span></label>
                    <input
                        type="text"
                        id="firstName"
                        bind:value={firstName}
                        placeholder="Enter your first name"
                        required
                    />
                </div>

                <div class="form-group">
                    <label for="lastName">Last Name <span class="required">*</span></label>
                    <input
                        type="text"
                        id="lastName"
                        bind:value={lastName}
                        placeholder="Enter your last name"
                        required
                    />
                </div>

                <!-- Row 3: Optional Info -->
                <div class="form-group">
                    <label for="username">Username <span class="optional">(Optional)</span></label>
                    <input
                        type="text"
                        id="username"
                        bind:value={username}
                        placeholder="Enter your username"
                    />
                </div>

                <div class="form-group">
                    <label for="school">School <span class="optional">(Optional)</span></label>
                    <input
                        type="text"
                        id="school"
                        bind:value={school}
                        placeholder="Enter your school name"
                    />
                </div>
            </div>

            <div class="form-actions">
                <button type="submit" disabled={!submitEnabled || loading || success} class="submit-button">
                    {#if loading}
                        Update Profile
                    {:else if success}
                        Updated!
                    {:else}
                        Update Profile
                    {/if}
                </button>
            </div>
        </form>
    </div>
{:else}
    <div class="loading">
        Redirecting to login...
    </div>
{/if}

<style lang="scss">
    @use '$styles/_global.scss' as *;

    .profile-container {
        max-width: 900px;
        margin: 2rem auto;
        padding: 2rem;
        background: $background-1;
        border: 3px solid $border-color;
        border-radius: 1rem;
        box-shadow: $shadow;
    }

    .profile-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 3px solid $border-color;

        h1 {
            color: $text-dark;
            margin: 0;
            font-size: 2rem;
        }
    }

    .success-message {
        background: $green;
        color: white;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1.5rem;
        text-align: center;
        font-weight: 600;
    }

    .profile-form {
        display: flex;
        flex-direction: column;
        gap: .5rem;
    }

    .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;

        @media (max-width: 600px) {
            grid-template-columns: 1fr;
        }
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        &.full-width {
            grid-column: 1 / -1;
        }
    }

    label {
        font-weight: 600;
        color: $text-dark;
        font-size: 1rem;
    }

    .optional {
        color: $text-muted;
        font-weight: normal;
        font-size: 0.9em;
    }

    .required {
        color: $red;
    }

    input {
        @extend %text-input;
        margin: 0;
        font-size: 1.1rem;
        width: 100%;
        box-sizing: border-box;
    }

    .email-text {
        font-size: 1.25rem;
        color: $text-dark;
        padding: 0.5rem 0;
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        padding-top: 1rem;
    }

    button {
        @extend %button;
        font-size: 1.1rem;
        padding: 0.75rem 1rem;
    }

    .submit-button {
        min-width: 10em;
        min-height: 3em;
    }

    .loading {
        text-align: center;
        padding: 2rem;
        font-size: 1.2rem;
        color: $text-muted;
    }

    .logout-button {
        background: $red;
    }
</style>
