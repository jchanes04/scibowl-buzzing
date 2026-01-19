<script lang="ts">
    import { user, isAuthenticated, type User } from "$lib/stores/auth";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { useQuery, useConvexClient } from "convex-svelte";
    import { api } from "../../../../convex/_generated/api";
    import GameHistoryItem from "$lib/components/GameHistoryItem.svelte";
    import { setContext } from "svelte";
    import { writable } from "svelte/store";

    const convex = useConvexClient();

    // Set up modal context
    const modalStore = writable<{
        component: any;
        props: Record<string, unknown>;
    } | null>(null);
    setContext("modalStore", modalStore);

    let authenticated = $state(false);
    let currentUser = $state<User | null>(null);
    let loading = $state(false);
    let success = $state(false);

    // Game history query - will be undefined until user is loaded
    let gameHistoryQuery = $derived(
        currentUser?.id
            ? useQuery(api.gameHistory.getByMemberId, {
                  memberId: currentUser.id,
              })
            : null,
    );

    // Private tags query
    let privateTagsQuery = $derived(
        currentUser?.id
            ? useQuery(api.tags.getPrivateTags, { userId: currentUser.id })
            : null,
    );

    // Filtered game history based on selected role
    let filteredGameHistory = $derived(
        gameHistoryQuery?.data
            ? gameHistoryQuery.data.filter(
                  (game) => game.memberType === selectedHistoryRole,
              )
            : [],
    );

    // Tag input state per game
    let tagInputs: Record<string, string> = $state({});
    let expandedGames: Set<string> = $state(new Set());

    // History role selector
    let selectedHistoryRole = $state("moderator");

    function toggleGameExpanded(gameId: string) {
        if (expandedGames.has(gameId)) {
            expandedGames.delete(gameId);
        } else {
            expandedGames.add(gameId);
        }
        expandedGames = new Set(expandedGames); // trigger reactivity
    }

    function getPrivateTagsForGame(gameId: string): string[] {
        if (!privateTagsQuery?.data) return [];
        const tags: string[] = [];
        for (const [tag, gameIds] of Object.entries(privateTagsQuery.data)) {
            if ((gameIds as string[]).includes(gameId)) {
                tags.push(tag);
            }
        }
        return tags;
    }

    async function addPrivateTag(gameId: string) {
        const tag = tagInputs[gameId]?.trim();
        if (!tag || !currentUser?.id) return;

        try {
            await convex.mutation(api.tags.addPrivateTag, {
                userId: currentUser.id,
                gameId,
                tag,
            });
            tagInputs[gameId] = "";
        } catch (e) {
            console.error("Failed to add tag:", e);
        }
    }

    async function removePrivateTag(gameId: string, tag: string) {
        if (!currentUser?.id) return;

        try {
            await convex.mutation(api.tags.removePrivateTag, {
                userId: currentUser.id,
                gameId,
                tag,
            });
        } catch (e) {
            console.error("Failed to remove tag:", e);
        }
    }

    async function addPublicTag(gameId: string) {
        const tag = tagInputs[`public-${gameId}`]?.trim();
        if (!tag) return;

        try {
            await convex.mutation(api.tags.addPublicTags, {
                gameId,
                tags: [tag],
            });
            tagInputs[`public-${gameId}`] = "";
        } catch (e) {
            console.error("Failed to add public tag:", e);
        }
    }

    async function removePublicTag(gameId: string, tag: string) {
        try {
            await convex.mutation(api.tags.removePublicTag, {
                gameId,
                tag,
            });
        } catch (e) {
            console.error("Failed to remove public tag:", e);
        }
    }

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

    onMount(() => {
        if (!authenticated) {
            goto("/");
        }
    });

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
    </div>

    <!-- Game History Section -->
    <div class="game-history-container">
        <div class="game-history-header">
            <h2>Game History</h2>
            <div class="history-role-selector">
                <label for="moderator-radio">
                    <input
                        type="radio"
                        id="moderator-radio"
                        name="history-role"
                        value="moderator"
                        bind:group={selectedHistoryRole}
                    />
                    <span>Moderator</span>
                </label>
                <label for="player-radio">
                    <input
                        type="radio"
                        id="player-radio"
                        name="history-role"
                        value="player"
                        bind:group={selectedHistoryRole}
                    />
                    <span>Player</span>
                </label>
            </div>
        </div>
        <div class="game-history-section">
            {#if gameHistoryQuery?.isLoading}
                <p class="loading-text">Loading game history...</p>
            {:else if filteredGameHistory && filteredGameHistory.length > 0}
                <ul class="game-list">
                    {#each filteredGameHistory as game}
                        <GameHistoryItem
                            {game}
                            {expandedGames}
                            {tagInputs}
                            {currentUser}
                            {privateTagsQuery}
                            {toggleGameExpanded}
                            {getPrivateTagsForGame}
                            {addPrivateTag}
                            {removePrivateTag}
                            {addPublicTag}
                            {removePublicTag}
                        />
                    {/each}
                </ul>
            {:else}
                <p class="no-games">
                    No {selectedHistoryRole} games played yet.
                </p>
            {/if}
        </div>
    </div>
{:else}
    <div class="loading">Redirecting to login...</div>
{/if}

{#if $modalStore}
    <div class="modal-background"></div>
    {@const SvelteComponent = $modalStore.component}
    <SvelteComponent {...$modalStore.props} />
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

    .game-history-container {
        max-width: 900px;
        margin: 2rem auto;
        padding: 2rem;
        background: $background-1;
        border: 3px solid $border-color;
        border-radius: 1rem;
        box-shadow: $shadow;
    }

    .game-history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 3px solid $border-color;

        h2 {
            color: $text;
            margin: 0;
            font-size: 2rem;
        }
    }

    .history-role-selector {
        display: flex;
        gap: 0.25em;
        background: $gray-1;
        padding: 0.3em;
        border-radius: 0.75em;
        border: 3px solid $border-color;
        align-items: stretch;
        width: 12em;
        label {
            cursor: pointer;
            flex: 1;
            display: flex;

            input {
                position: absolute;
                opacity: 0;
                width: 0;
                height: 0;

                &:checked ~ span {
                    background: $background-1;
                    color: $primary;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                }
            }

            span {
                display: flex;
                align-items: center;
                justify-content: center;
                flex: 1;
                padding: 0;
                border-radius: 0.5em;
                font-size: 1rem;
                font-weight: 600;
                transition: all 0.2s;
                color: $gray-2;
                text-align: center;
                line-height: 1.2;
                min-height: 2.5rem;

                &:hover {
                    background: $background-1;
                    color: $primary;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                }
            }
        }
    }

    .loading-text,
    .no-games {
        color: $text-muted;
        font-size: 1rem;
    }

    .game-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .modal-background {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 100vw;
        background-color: rgba(0, 0, 0, 0.3);
        z-index: 1000;
    }
</style>
