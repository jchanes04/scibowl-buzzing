<script lang="ts">
    import { tournamentStore } from "$lib/stores/tournament.svelte";
    import {
        editableSettings,
        initSettings,
    } from "$lib/stores/settings.svelte";

    let tournament = $derived(tournamentStore.value);
    let isOrganizer = $derived(tournamentStore.isOrganizer);

    // Initialize editable settings from tournament data
    $effect(() => {
        if (tournament.id) {
            initSettings(tournament);
        }
    });
</script>

<section class="settings-section">
    {#if isOrganizer && !tournament.bracketConfirmed}
        <h2>Tournament Settings</h2>
        <!-- Edit Mode -->
        {#if tournament.settings}
            <div class="settings-form">
                <div class="setting-row">
                    <label for="tournament-name">Tournament Name</label>
                    <input
                        id="tournament-name"
                        type="text"
                        bind:value={editableSettings.name}
                        placeholder="Tournament Name"
                    />
                </div>

                <div class="setting-row">
                    <label for="spectators">Spectators Allowed</label>
                    <input
                        id="spectators"
                        type="checkbox"
                        bind:checked={editableSettings.spectatorsAllowed}
                    />
                </div>

                <div class="setting-row">
                    <span class="setting-label">Players per Team</span>
                    <div class="inline-inputs">
                        <input
                            type="number"
                            min="1"
                            max="10"
                            bind:value={editableSettings.minPlayers}
                        />
                        <span>to</span>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            bind:value={editableSettings.maxPlayers}
                        />
                    </div>
                </div>

                <div class="setting-row">
                    <span class="setting-label">Timers (seconds)</span>
                    <div class="point-values-grid">
                        <div class="point-input">
                            <span>Tossup</span>
                            <input
                                type="number"
                                min="1"
                                bind:value={editableSettings.tossupTime}
                            />
                        </div>
                        <div class="point-input">
                            <span>Bonus</span>
                            <input
                                type="number"
                                min="1"
                                bind:value={editableSettings.bonusTime}
                            />
                        </div>
                        <div class="point-input">
                            <span>Visual</span>
                            <input
                                type="number"
                                min="1"
                                bind:value={editableSettings.visualTime}
                            />
                        </div>
                    </div>
                </div>

                <div class="setting-row">
                    <span class="setting-label">Point Values</span>
                    <div class="point-values-grid">
                        <div class="point-input">
                            <span>Tossup</span>
                            <input
                                type="number"
                                bind:value={editableSettings.tossupPoints}
                            />
                        </div>
                        <div class="point-input">
                            <span>Bonus</span>
                            <input
                                type="number"
                                bind:value={editableSettings.bonusPoints}
                            />
                        </div>
                        <div class="point-input">
                            <span>Penalty</span>
                            <input
                                type="number"
                                bind:value={editableSettings.penaltyPoints}
                            />
                        </div>
                    </div>
                </div>
            </div>
        {:else}
            <p class="no-settings">
                Settings not available for legacy tournaments.
            </p>
        {/if}
    {:else}
        <h2>Tournament Rules</h2>
        <!-- Read Only Mode (Confirmed Bracket) -->
        {#if tournament.settings}
            <div class="settings-info">
                <ul>
                    <li>
                        <strong>Spectators</strong>
                        {tournament.settings.spectatorsAllowed
                            ? "allowed"
                            : "not allowed"}
                    </li>
                    <li>
                        <strong>Players per team:</strong>
                        {tournament.settings.minPlayers} - {tournament.settings
                            .maxPlayers}
                    </li>
                    <li>
                        <strong>Timers:</strong>
                        <ul>
                            <li>
                                <strong>Tossup:</strong>
                                {tournament.settings.times.tossup[0]}s
                            </li>
                            <li>
                                <strong>Bonus:</strong>
                                {tournament.settings.times.bonus[0]}s
                            </li>
                            <li>
                                <strong>Visual:</strong>
                                {tournament.settings.times.visual[0]}s
                            </li>
                        </ul>
                    </li>
                    <li>
                        <strong>Point values:</strong>
                        <ul>
                            <li>
                                <strong>Tossup:</strong>
                                {tournament.settings.pointValues.tossup}
                            </li>
                            <li>
                                <strong>Bonus:</strong>
                                {tournament.settings.pointValues.bonus}
                            </li>
                            <li>
                                <strong>Penalty:</strong>
                                {tournament.settings.pointValues.penalty}
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        {:else}
            <p class="no-settings">
                Settings not available for legacy tournaments.
            </p>
        {/if}
    {/if}
</section>

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

    .settings-info {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        p {
            margin: 0;
            color: $text;
        }
    }

    .settings-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .setting-row {
        display: flex;
        align-items: center;
        gap: 1rem;

        label,
        .setting-label {
            font-weight: 600;
            color: $text;
            min-width: 180px;
        }

        input[type="text"],
        input[type="number"] {
            @extend %text-input;
            padding: 0.5rem;
            font-size: 1rem;
            max-width: 200px;
        }

        input[type="checkbox"] {
            width: 1.25rem;
            height: 1.25rem;
            cursor: pointer;
        }
    }

    .inline-inputs {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        input {
            width: 70px;
        }

        span {
            color: $text-muted;
        }
    }

    .point-values-grid {
        display: flex;
        gap: 1rem;
    }

    .point-input {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        span {
            font-size: 0.85rem;
            color: $text-muted;
        }

        input {
            @extend %text-input;
            width: 80px;
            padding: 0.4rem;
            font-size: 0.95rem;
        }
    }

    .no-settings {
        color: $text-muted;
        font-style: italic;
    }
</style>
