<script lang="ts">
    import { page } from "$app/stores";
    import { tournamentStore } from "$lib/stores/tournament.svelte";
    import { useConvexClient } from "convex-svelte";
    import {
        pendingSeedsStore,
        saveBracketStructure,
        confirmBracketStructure,
        cancelPendingChanges,
    } from "$lib/stores/bracket.svelte";
    import { saveSettings } from "$lib/stores/settings.svelte";

    let tournament = $derived(tournamentStore.value);
    let isOrganizer = $derived(tournamentStore.isOrganizer);
    let pendingSeedsSize = $derived(pendingSeedsStore.size);

    const convex = useConvexClient();

    async function handleSaveAll() {
        await Promise.all([
            saveBracketStructure(convex),
            saveSettings(convex, tournament.id),
        ]);
    }

    function copyRegistrationLink() {
        const url = `${$page.url.origin}/tournament/register/${tournament.id}`;
        navigator.clipboard.writeText(url);
        alert("Registration link copied to clipboard!");
    }
</script>

<div class="tournament-header">
    <h1>{tournament.name}</h1>
    {#if isOrganizer}
        <div class="organizer-actions">
            {#if !tournament.bracketConfirmed}
                <button class="save-btn" onclick={handleSaveAll}>
                    Save Settings
                </button>
                <button
                    class="confirm-btn"
                    onclick={() => confirmBracketStructure(convex)}
                >
                    Confirm Settings & Create Games
                </button>
                {#if pendingSeedsSize > 0}
                    <button class="cancel-btn" onclick={cancelPendingChanges}>
                        Cancel Changes
                    </button>
                {/if}
            {/if}
            <button class="copy-link-btn" onclick={copyRegistrationLink}>
                Copy Registration Link
            </button>
        </div>
    {/if}
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    .tournament-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;

        h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: $text;
            text-decoration: underline var(--primary) 3px;
            text-underline-offset: 0.2em;
            margin: 0;
        }
    }

    .organizer-actions {
        display: flex;
        gap: 0.5rem;
    }

    .copy-link-btn {
        @extend %button;
        background: $primary;
        font-size: 1rem;
    }

    .save-btn {
        @extend %button;
        background: $gray-2;
        font-size: 1rem;
    }

    .confirm-btn {
        @extend %button;
        background: $primary;
        font-size: 1rem;
    }

    .cancel-btn {
        @extend %button;
        background: $gray-2;
        font-size: 1rem;
    }
</style>
