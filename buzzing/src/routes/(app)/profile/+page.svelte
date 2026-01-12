<script lang="ts">
    import { user, isAuthenticated, type User } from "$lib/stores/auth";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { ConvexHttpClient } from "convex/browser";
    import { api } from "../../../../convex/_generated/api";
    import { env } from "$env/dynamic/public";

    let authenticated = $state(false);
    let currentUser = $state<User | null>(null);
    let loading = $state(false);
    let success = $state(false);
    let userGames = $state<any[]>([]);
    let gamesLoading = $state(false);

    let { data } = $props();
    let activeGameIds = $derived(data.activeGameIds || []);

    // Form fields
    let firstName = $state("");
    let lastName = $state("");
    let username = $state("");
    let school = $state("");

    // Subscribe to auth state
    $effect(() => {
        const unsubscribeUser = user.subscribe((value) => {
            currentUser = value;
            if (value) {
                firstName = value.firstName || "";
                lastName = value.lastName || "";
                username = value.username || "";
                school = value.school || "";
            }
        });
        const unsubscribeAuth = isAuthenticated.subscribe(
            (value) => (authenticated = value),
        );

        return () => {
            unsubscribeUser();
            unsubscribeAuth();
        };
    });

    let submitEnabled = $derived(firstName.trim() && lastName.trim());

    onMount(async () => {
        if (!authenticated) {
            goto("/");
        } else {
            await loadUserGames();
        }
    });

    async function loadUserGames() {
        if (!currentUser) return;

        gamesLoading = true;
        try {
            const convex = new ConvexHttpClient(
                env.PUBLIC_CONVEX_URL as string,
            );
            userGames = await convex.query(api.games.getUserGames, {
                userId: currentUser.id,
            });
        } catch (error) {
            console.error("Error loading user games:", error);
        } finally {
            gamesLoading = false;
        }
    }

    function handleLogout() {
        window.location.href = "/auth/logout";
    }

    async function handleSubmit() {
        loading = true;
        success = false;

        try {
            const response = await fetch("/api/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
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
                setTimeout(() => (success = false), 2000);
            } else {
                const error = await response.json();
                alert(`Error: ${error.message || "Failed to update profile"}`);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile. Please try again.");
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
                        {currentUser?.email || ""}
                    </div>
                </div>

                <!-- Row 2: Names -->
                <div class="form-group">
                    <label for="firstName"
                        >First Name <span class="required">*</span></label
                    >
                    <input
                        type="text"
                        id="firstName"
                        bind:value={firstName}
                        placeholder="Enter your first name"
                        required
                    />
                </div>

                <div class="form-group">
                    <label for="lastName"
                        >Last Name <span class="required">*</span></label
                    >
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
                    <label for="username"
                        >Username <span class="optional">(Optional)</span
                        ></label
                    >
                    <input
                        type="text"
                        id="username"
                        bind:value={username}
                        placeholder="Enter your username"
                    />
                </div>

                <div class="form-group">
                    <label for="school"
                        >School <span class="optional">(Optional)</span></label
                    >
                    <input
                        type="text"
                        id="school"
                        bind:value={school}
                        placeholder="Enter your school name"
                    />
                </div>
            </div>

            <div class="form-actions">
                <button
                    type="submit"
                    disabled={!submitEnabled || loading || success}
                    class="submit-button"
                >
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

        <!-- Game History Section -->
        <div class="games-section">
            <h2>Game History</h2>
            {#if gamesLoading}
                <div class="loading-games">Loading your games...</div>
            {:else if userGames.length === 0}
                <div class="no-games">
                    <p>You haven't participated in any games yet.</p>
                    <a href="/create" class="create-game-link"
                        >Create your first game</a
                    >
                </div>
            {:else}
                <div class="games-list">
                    {#each userGames as game}
                        <div
                            class="game-item"
                            class:inactive={!game.userActive}
                        >
                            <div class="game-info">
                                <h3>{game.name}</h3>
                                <div class="game-details">
                                    <span class="game-code"
                                        >Code: {game.joinCode}</span
                                    >
                                    <span class="game-role"
                                        >Role: {game.userRole}</span
                                    >
                                    <span class="game-date"
                                        >Last active: {new Date(
                                            game.lastActive,
                                        ).toLocaleDateString()}</span
                                    >
                                </div>
                            </div>
                            <div class="game-actions">
                                {#if activeGameIds.includes(game._id)}
                                    <span class="status active">Live</span>
                                {:else}
                                    <span class="status inactive">Swept</span>
                                {/if}
                                <a href="/game/{game._id}?code={game.joinCode}" class="rejoin-button"
                                    >Rejoin</a
                                >
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
{:else}
    <div class="loading">Redirecting to login...</div>
{/if}

<style lang="scss">
    @use "$styles/_global.scss" as *;

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
            color: $text;
            margin: 0;
            font-size: 2rem;
        }
    }

    .profile-form {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
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
        color: $text;
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
        color: $text;
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

    .games-section {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 3px solid $border-color;

        h2 {
            color: $text;
            margin-bottom: 1.5rem;
            font-size: 1.8rem;
        }
    }

    .loading-games,
    .no-games {
        text-align: center;
        padding: 2rem;
        color: $text-muted;
        font-size: 1.1rem;
    }

    .no-games {
        p {
            margin-bottom: 1rem;
        }

        .create-game-link {
            color: $primary;
            text-decoration: none;
            font-weight: 600;

            &:hover {
                text-decoration: underline;
            }
        }
    }

    .games-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .game-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        background: $background-2;
        border: 2px solid $border-color;
        border-radius: 0.5rem;
        transition: all 0.2s ease;

        &:hover {
            border-color: $primary;
            box-shadow: $shadow;
        }

        &.inactive {
            opacity: 0.7;
            border-color: $gray-2;
        }

        .game-info {
            flex: 1;

            h3 {
                margin: 0 0 0.5rem 0;
                color: $text;
                font-size: 1.3rem;
            }

            .game-details {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                font-size: 0.9rem;
                color: $text-muted;

                span {
                    padding: 0.25rem 0.5rem;
                    background: $background-1;
                    border-radius: 0.25rem;
                    border: 1px solid $gray-2;
                }
            }
        }

        .status {
            padding: 0.5rem 1rem;
            border-radius: 1rem;
            font-weight: 600;
            font-size: 0.9rem;

            &.active {
                background: $green;
                color: white;
            }

            &.inactive {
                background: $text-muted;
                color: white;
            }
        }
    }

    @media (max-width: 600px) {
        .game-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;

            .game-details {
                gap: 0.5rem;

                span {
                    font-size: 0.8rem;
                }
            }
        }
    }

    .game-actions {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.5rem;
    }

    .rejoin-button {
        @extend %button;
        font-size: 0.9rem;
        background: $primary;
        color: $text-light;
        text-decoration: none;
    }
</style>
