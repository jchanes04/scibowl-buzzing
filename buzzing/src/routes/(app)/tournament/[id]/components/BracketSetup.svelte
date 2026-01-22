<script lang="ts">
    import TournamentTeamCard from "$lib/components/TournamentTeamCard.svelte";
    import {
        tournamentStore,
        tournamentTeamsStore,
    } from "$lib/stores/tournament.svelte";
    import {
        bracketSizeStore,
        randomizeSeeds,
    } from "$lib/stores/bracket.svelte";

    // Get values from stores
    let tournament = $derived(tournamentStore.value);
    let isOrganizer = $derived(tournamentStore.isOrganizer);
    let teams = $derived(tournamentTeamsStore.value);
    let selectedBracketSize = $derived(bracketSizeStore.value);

    function handleBracketSizeChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        bracketSizeStore.value = parseInt(target.value);
    }
</script>

{#if isOrganizer && !tournament.bracketConfirmed}
    <section class="bracket-setup-section">
        <h2>Bracket Setup</h2>

        <!-- Registered Teams (inline in setup) -->
        <div class="registered-teams-inline">
            <h3>Registered Teams ({teams?.length ?? 0})</h3>
            {#if teams?.length === 0}
                <p class="no-teams">No teams registered yet.</p>
            {:else}
                <div class="teams-grid">
                    {#each teams ?? [] as team}
                        <TournamentTeamCard {team} />
                    {/each}
                </div>
            {/if}
        </div>

        <div class="bracket-size-selector">
            <label for="bracket-size">Bracket Size:</label>
            <select
                id="bracket-size"
                value={selectedBracketSize}
                onchange={handleBracketSizeChange}
                disabled={tournament.bracketConfirmed}
            >
                {#each Array.from({ length: Math.max(teams?.length ?? 0, 16) }, (_, i) => i + 2) as size}
                    <option value={size}>{size} Teams</option>
                {/each}
            </select>
        </div>

        <div class="setup-actions">
            <button
                class="randomize-btn"
                onclick={randomizeSeeds}
                disabled={tournament.bracketConfirmed ||
                    (teams?.length ?? 0) === 0}
            >
                Randomize Seeds
            </button>
        </div>

        <p class="setup-hint">
            Assign seeds to teams above (in the bracket below), then Save
            Structure. When ready, click "Confirm Structure & Create Games" to
            lock the bracket and generate all match games.
        </p>
    </section>
{/if}

<style lang="scss">
    @use "$styles/_global.scss" as *;

    section {
        background: $background-1;
        border: 3px solid $border-color;
        border-radius: 1rem;
        padding: 1.5rem;
        box-shadow: $shadow;

        h2 {
            color: $text;
            font-size: 1.5rem;
            margin: 0 0 1rem 0;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid $border-color;
        }
    }

    // Shared Team Grid Styles
    .teams-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
        width: 100%;
    }

    .no-teams {
        color: $text-muted;
        font-style: italic;
    }

    .bracket-setup-section {
        .bracket-size-selector {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;

            label {
                font-weight: 600;
                color: $text;
            }

            select {
                @extend %text-input;
                padding: 0.5rem;
                font-size: 1rem;
            }
        }

        .setup-actions {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            margin-bottom: 1rem;
        }

        .randomize-btn {
            @extend %button;
            background: $orange;
            font-size: 1rem;
        }

        .setup-hint {
            color: $text-muted;
            font-style: italic;
            margin: 0;
        }

        .registered-teams-inline {
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: $background-2;
            border-radius: 0.75rem;
            border: 2px solid $border-color;

            h3 {
                margin: 0 0 0.75rem 0;
                font-size: 1.1rem;
                color: $text;
            }
        }
    }
</style>
