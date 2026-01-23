<script lang="ts">
    import TournamentTeamCard from "$lib/components/TournamentTeamCard.svelte";
    import {
        tournamentStore,
        tournamentTeamsStore,
    } from "$lib/stores/tournament.svelte";
    import {
        bracketSizeStore,
        bracketTypeStore,
        grandFinalResetStore,
        randomizeSeeds,
    } from "$lib/stores/bracket.svelte";
    import type { BracketType } from "../types";
    import CollapsibleSection from "$lib/components/CollapsibleSection.svelte";

    // Collapsible state for registered teams
    let teamsOpen = $state(false);

    // Get values from stores
    let tournament = $derived(tournamentStore.value);
    let isOrganizer = $derived(tournamentStore.isOrganizer);
    let currentUserId = $derived(tournamentStore.userId);
    let teams = $derived(tournamentTeamsStore.value);
    let selectedBracketSize = $derived(bracketSizeStore.value);
    let selectedBracketType = $derived(bracketTypeStore.value);
    let selectedGrandFinalReset = $derived(grandFinalResetStore.value);

    // Helper to check if a number is a power of 2
    function isPowerOfTwo(n: number): boolean {
        return n > 0 && (n & (n - 1)) === 0;
    }

    // Get valid bracket sizes based on bracket type
    function getValidBracketSizes(
        bracketType: BracketType,
        maxTeams: number,
    ): number[] {
        const sizes: number[] = [];
        if (bracketType === "double") {
            // Double elimination only supports power of 2
            for (let p = 2; p <= Math.max(maxTeams, 16); p *= 2) {
                sizes.push(p);
            }
        } else {
            // Single elimination supports any size >= 2
            for (let i = 2; i <= Math.max(maxTeams, 16); i++) {
                sizes.push(i);
            }
        }
        return sizes;
    }

    // Get the nearest valid bracket size when switching types
    function getNearestValidSize(
        currentSize: number,
        bracketType: BracketType,
    ): number {
        if (bracketType === "single") return currentSize;

        // For double elimination, find nearest power of 2
        if (isPowerOfTwo(currentSize)) return currentSize;

        // Find next power of 2 >= currentSize
        let power = 2;
        while (power < currentSize) {
            power *= 2;
        }
        return power;
    }

    let validBracketSizes = $derived(
        getValidBracketSizes(selectedBracketType, teams?.length ?? 0),
    );

    function handleBracketSizeChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        bracketSizeStore.value = parseInt(target.value);
    }

    function handleBracketTypeChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const newType = target.value as BracketType;
        bracketTypeStore.value = newType;

        // Adjust bracket size if switching to double elimination with non-power-of-2 size
        if (newType === "double" && !isPowerOfTwo(selectedBracketSize)) {
            bracketSizeStore.value = getNearestValidSize(
                selectedBracketSize,
                newType,
            );
        }
    }

    function handleWinnerTakesAllChange(event: Event) {
        const target = event.target as HTMLInputElement;
        // Winner Takes All = true means no reset (grandFinalReset = false)
        grandFinalResetStore.value = !target.checked;
    }
</script>

{#if isOrganizer && !tournament.bracketConfirmed}
    <section class="bracket-setup-section">
        <h2>Bracket Setup</h2>

        <!-- Registered Teams (collapsible) -->
        <CollapsibleSection
            title="Registered Teams ({teams?.length ?? 0})"
            bind:open={teamsOpen}
        >
            {#if teams?.length === 0}
                <p class="no-teams">No teams registered yet.</p>
            {:else}
                <div class="teams-grid">
                    {#each teams ?? [] as team}
                        <TournamentTeamCard
                            {team}
                            {currentUserId}
                            tournamentId={tournament.id}
                        />
                    {/each}
                </div>
            {/if}
        </CollapsibleSection>

        <div class="bracket-options">
            <div class="bracket-size-selector">
                <label for="bracket-size">Bracket Size:</label>
                <select
                    id="bracket-size"
                    value={selectedBracketSize}
                    onchange={handleBracketSizeChange}
                    disabled={tournament.bracketConfirmed}
                >
                    {#each validBracketSizes as size}
                        <option value={size}>{size} Teams</option>
                    {/each}
                </select>
                {#if selectedBracketType === "double"}
                    <span class="size-hint"
                        >(Double elimination requires power of 2)</span
                    >
                {/if}
            </div>

            <div class="bracket-type-selector">
                <label for="bracket-type">Bracket Type:</label>
                <select
                    id="bracket-type"
                    value={selectedBracketType}
                    onchange={handleBracketTypeChange}
                    disabled={tournament.bracketConfirmed}
                >
                    <option value="single">Single Elimination</option>
                    <option value="double">Double Elimination</option>
                </select>
            </div>

            {#if selectedBracketType === "double"}
                <div class="grand-final-reset-toggle">
                    <label for="winner-takes-all">
                        <input
                            type="checkbox"
                            id="winner-takes-all"
                            checked={!selectedGrandFinalReset}
                            onchange={handleWinnerTakesAllChange}
                            disabled={tournament.bracketConfirmed}
                        />
                        Winner Takes All Finals
                    </label>
                    <span class="reset-hint">
                        (Single finals match determines tournament winner)
                    </span>
                </div>
            {/if}
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
        .bracket-options {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-bottom: 1rem;
            padding: 1rem;
            background: $background-2;
            border-radius: 0.75rem;
            border: 2px solid $border-color;
        }

        .bracket-size-selector,
        .bracket-type-selector {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;

            label {
                font-weight: 600;
                color: $text;
                min-width: 100px;
            }

            select {
                @extend %text-input;
                padding: 0.5rem;
                font-size: 1rem;
            }
        }

        .bracket-size-selector .size-hint {
            color: $text-muted;
            font-size: 0.85rem;
            font-style: italic;
        }

        .grand-final-reset-toggle {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.5rem;

            label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: 600;
                color: $text;
                cursor: pointer;

                input[type="checkbox"] {
                    width: 1.2rem;
                    height: 1.2rem;
                    cursor: pointer;
                }
            }

            .reset-hint {
                color: $text-muted;
                font-size: 0.85rem;
                font-style: italic;
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

        :global(.collapsible-section) {
            margin-top: 0;
            margin-bottom: 1.5rem;
        }
    }
</style>
