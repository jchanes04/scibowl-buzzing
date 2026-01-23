<script lang="ts">
    import { enhance } from "$app/forms";
    import { user, isAuthenticated } from "$lib/stores/auth";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import CollapsibleSection from "$lib/components/CollapsibleSection.svelte";
    import LoginButton from "$lib/components/LoginButton.svelte";

    interface Props {
        form?: { message?: string };
    }

    let { form }: Props = $props();

    let authenticated = $state(false);
    let currentUser = $state<any>(null);

    // Subscribe to auth state
    $effect(() => {
        const unsubscribeUser = user.subscribe(
            (value) => (currentUser = value),
        );
        const unsubscribeAuth = isAuthenticated.subscribe(
            (value) => (authenticated = value),
        );

        return () => {
            unsubscribeUser();
            unsubscribeAuth();
        };
    });

    onMount(() => {
        if (!authenticated) {
            // Will show login prompt
        }
    });

    // Form state
    let tournamentName = $state("");

    // Timer settings (default values)
    let tossupTime = $state(5);
    let bonusTime = $state(20);
    let visualTime = $state(30);

    // Point value settings
    let tossupPoints = $state(4);
    let bonusPoints = $state(10);
    let penaltyPoints = $state(-4);

    // Tournament-specific settings
    let spectatorsAllowed = $state(false);
    let minPlayers = $state(1);
    let maxPlayers = $state(5);

    // Bracket settings
    let bracketType = $state<"single" | "double">("single");
    let grandFinalReset = $state(true);

    // Collapsible section states
    let timerSettingsOpen = $state(false);
    let pointSettingsOpen = $state(false);
    let teamSettingsOpen = $state(false);
    let bracketSettingsOpen = $state(false);

    let submitEnabled = $derived(authenticated && tournamentName.trim());
</script>

<svelte:head>
    <title>Create Tournament</title>
</svelte:head>

<main>
    <h1>Create Tournament</h1>

    {#if !authenticated}
        <div class="login-prompt">
            <p>You must be logged in to create a tournament.</p>
            <LoginButton />
        </div>
    {:else}
        <form id="form" method="POST" autocomplete="off" use:enhance>
            {#if form?.message}
                <p class="error">{form.message}</p>
            {/if}

            <input
                type="text"
                placeholder="Tournament Name"
                name="tournament-name"
                id="tournament-name-input"
                bind:value={tournamentName}
            />

            <CollapsibleSection
                title="Team Settings"
                bind:open={teamSettingsOpen}
            >
                <div class="settings-grid">
                    <div class="form-group">
                        <label for="min-players">Min Players per Team</label>
                        <input
                            type="number"
                            id="min-players"
                            name="min-players"
                            bind:value={minPlayers}
                            min="1"
                            max="10"
                        />
                    </div>

                    <div class="form-group">
                        <label for="max-players">Max Players per Team</label>
                        <input
                            type="number"
                            id="max-players"
                            name="max-players"
                            bind:value={maxPlayers}
                            min="1"
                            max="10"
                        />
                    </div>
                </div>

                <div class="checkbox-wrapper">
                    <label for="spectators">
                        <input
                            id="spectators"
                            type="checkbox"
                            name="spectators-allowed"
                            bind:checked={spectatorsAllowed}
                        />
                        <span></span>
                        Spectators allowed
                    </label>
                </div>
            </CollapsibleSection>

            <CollapsibleSection
                title="Timer Lengths"
                bind:open={timerSettingsOpen}
            >
                <div class="settings-grid">
                    <div class="form-group">
                        <label for="tossup-time">Tossup</label>
                        <input
                            type="number"
                            id="tossup-time"
                            name="tossup-time"
                            bind:value={tossupTime}
                            placeholder="5"
                            min="1"
                            max="300"
                        />
                    </div>

                    <div class="form-group">
                        <label for="bonus-time">Bonus</label>
                        <input
                            type="number"
                            id="bonus-time"
                            name="bonus-time"
                            bind:value={bonusTime}
                            placeholder="20"
                            min="1"
                            max="300"
                        />
                    </div>

                    <div class="form-group">
                        <label for="visual-time">Visual</label>
                        <input
                            type="number"
                            id="visual-time"
                            name="visual-time"
                            bind:value={visualTime}
                            placeholder="30"
                            min="1"
                            max="300"
                        />
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection
                title="Point Values"
                bind:open={pointSettingsOpen}
            >
                <div class="settings-grid">
                    <div class="form-group">
                        <label for="tossup-points">Tossup</label>
                        <input
                            type="number"
                            id="tossup-points"
                            name="tossup-points"
                            bind:value={tossupPoints}
                            placeholder="4"
                            min="-100"
                            max="100"
                        />
                    </div>

                    <div class="form-group">
                        <label for="bonus-points">Bonus</label>
                        <input
                            type="number"
                            id="bonus-points"
                            name="bonus-points"
                            bind:value={bonusPoints}
                            placeholder="10"
                            min="-100"
                            max="100"
                        />
                    </div>

                    <div class="form-group">
                        <label for="penalty-points">Penalty</label>
                        <input
                            type="number"
                            id="penalty-points"
                            name="penalty-points"
                            bind:value={penaltyPoints}
                            placeholder="-4"
                            min="-100"
                            max="100"
                        />
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection
                title="Bracket Format"
                bind:open={bracketSettingsOpen}
            >
                <div class="settings-grid two-col">
                    <div class="form-group">
                        <label for="bracket-type">Bracket Type</label>
                        <select
                            id="bracket-type"
                            name="bracket-type"
                            bind:value={bracketType}
                        >
                            <option value="single">Single Elimination</option>
                            <option value="double">Double Elimination</option>
                        </select>
                    </div>

                    {#if bracketType === "double"}
                        <div class="form-group">
                            <label for="grand-final-reset"
                                >Winner Takes All Finals</label
                            >
                            <select
                                id="grand-final-reset"
                                name="grand-final-reset"
                                bind:value={grandFinalReset}
                            >
                                <option value={false}>Enabled</option>
                                <option value={true}>Disabled</option>
                            </select>
                        </div>
                    {/if}
                </div>

                <p class="settings-hint">
                    {#if bracketType === "single"}
                        <strong>Single Elimination:</strong> Teams are eliminated
                        after one loss.
                    {:else}
                        <strong>Double Elimination:</strong> Teams must lose
                        twice to be eliminated.
                        {#if !grandFinalReset}
                            A single finals match determines the winner.
                        {:else}
                            If the losers bracket champion wins the first finals
                            match, a second match is played to determine the
                            tournament winner.
                        {/if}
                    {/if}
                </p>
            </CollapsibleSection>

            <button type="submit" disabled={!submitEnabled}
                >Create Tournament</button
            >
        </form>
    {/if}
</main>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    main {
        max-width: 600px;
        margin: 2rem auto;
        padding: 0 1rem;
    }

    form {
        margin: 0 auto;
        border-radius: 1.5rem;
        text-align: center;
        padding: 3rem;
        background: $background-1;
        box-shadow: $shadow;
        border: 3px solid $border-color;
    }

    h1 {
        font-size: 3rem;
        font-weight: 800;
        margin-bottom: 2rem;
        color: $text;
        text-align: center;
        text-decoration: underline var(--primary) 3px;
        text-underline-offset: 0.2em;
    }

    .login-prompt {
        text-align: center;
        padding: 3rem;
        background: $background-1;
        border-radius: 1.5rem;
        border: 3px solid $border-color;
        box-shadow: $shadow;

        p {
            font-size: 1.2rem;
            color: $text;
            margin-bottom: 1.5rem;
        }
    }

    .error {
        color: $red;
        background: rgba($red, 0.1);
        padding: 0.75rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        font-weight: 600;
    }

    input[type="text"] {
        @extend %text-input;
        font-size: 1.1rem;
        width: 90%;
        text-align: left;
        margin-bottom: 1rem;
    }

    .settings-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 1.5rem;
        margin-top: 1rem;

        &.two-col {
            grid-template-columns: 1fr 1fr;
        }

        @media (max-width: 600px) {
            grid-template-columns: 1fr;
        }
    }

    .settings-hint {
        color: $text-muted;
        font-size: 0.9rem;
        font-style: italic;
        margin-top: 1rem;
        text-align: left;
        padding: 0.75rem;
        background: $background-2;
        border-radius: 0.5rem;
        border: 1px solid $border-color;
    }

    select {
        @extend %text-input;
        margin: 0;
        font-size: 1.1rem;
        width: 100%;
        box-sizing: border-box;
        cursor: pointer;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    label {
        font-weight: 600;
        color: $text;
        font-size: 1rem;
        text-align: left;
        margin-left: 1em;
    }

    input[type="number"] {
        @extend %text-input;
        margin: 0;
        font-size: 1.1rem;
        width: 100%;
        box-sizing: border-box;
    }

    .checkbox-wrapper {
        text-align: left;
        display: block;
        margin-top: 1rem;

        label {
            cursor: pointer;
            display: flex;
            margin: 0.25rem;
            align-items: center;
            gap: 0.5rem;
            font-size: 1rem;
            font-weight: 500;
            padding: 0.5rem 0.5rem;
            border-radius: 0.75rem;
            transition: all 0.2s;
            border: 1px solid transparent;

            &:hover {
                background: $background-2;
                border-color: $border-color;
            }

            input {
                position: absolute;
                opacity: 0;
                width: 0;
                height: 0;
            }

            span {
                width: 1.25rem;
                height: 1.25rem;
                border-radius: 0.4rem;
                border: $gray-2 2px solid;
                display: grid;
                place-content: center;
                background: $background-1;
                transition: all 0.2s;

                &::after {
                    content: "";
                    display: block;
                    width: 0.8rem;
                    height: 0.8rem;
                    border-radius: 0.15rem;
                    background: $primary;
                    transform: #{"scale(0)"};
                    transition: transform 0.1s;
                }
            }

            input:checked ~ span {
                border-color: $primary;
                &::after {
                    transform: #{"scale(1)"};
                }
            }
        }
    }

    button[type="submit"] {
        @extend %button;
        font-size: 1.25rem;
        width: 90%;
        padding: 0.8rem;
        margin-top: 2rem;
        background: $primary;
    }
</style>
