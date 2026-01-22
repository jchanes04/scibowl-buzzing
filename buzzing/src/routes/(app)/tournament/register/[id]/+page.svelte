<script lang="ts">
    import { enhance } from "$app/forms";
    import type { PageData, ActionData } from "./$types";
    import LoginButton from "$lib/components/LoginButton.svelte";
    import MultiNameInput from "$lib/components/MultiNameInput.svelte";

    interface Props {
        data: PageData;
        form: ActionData;
    }

    let { data, form }: Props = $props();
    let tournament = $derived(data.tournament);
    let isAuthenticated = $derived(data.isAuthenticated);

    // Form state
    let teamName = $state("");
    let players = $state<string[]>([]);
    let newPlayerName = $state("");

    let playersJson = $derived(JSON.stringify(players));

    // Use defaults for legacy tournaments without settings
    let minPlayers = $derived(tournament.settings?.minPlayers ?? 1);
    let maxPlayers = $derived(tournament.settings?.maxPlayers ?? 10);

    let submitEnabled = $derived(
        isAuthenticated &&
            teamName.trim() &&
            players.length >= minPlayers &&
            players.length <= maxPlayers,
    );

    let playerCountMessage = $derived(() => {
        if (players.length < minPlayers) {
            return `Need at least ${minPlayers - players.length} more player(s)`;
        }
        if (players.length > maxPlayers) {
            return `Too many players (max ${maxPlayers})`;
        }
        return `${players.length} / ${maxPlayers} players`;
    });
</script>

<svelte:head>
    <title>Register for {tournament.name}</title>
</svelte:head>

<main>
    <h1>Register for {tournament.name}</h1>

    {#if !isAuthenticated}
        <div class="login-prompt">
            <p>You must be logged in to register a team.</p>
            <LoginButton />
        </div>
    {:else}
        <form method="POST" autocomplete="off" use:enhance>
            {#if form?.message}
                <p class="error">{form.message}</p>
            {/if}

            <input type="hidden" name="players" value={playersJson} />

            <div class="form-section">
                <label for="team-name">Team Name</label>
                <input
                    type="text"
                    id="team-name"
                    name="team-name"
                    placeholder="Enter your team name"
                    bind:value={teamName}
                />
            </div>

            <div class="form-section">
                <h3 class="section-title">
                    Players
                    <span
                        class="player-count"
                        class:warning={players.length < minPlayers ||
                            players.length > maxPlayers}
                    >
                        ({playerCountMessage()})
                    </span>
                </h3>

                <MultiNameInput
                    bind:items={players}
                    bind:newItemName={newPlayerName}
                    placeholder="Add player name..."
                    maxItems={maxPlayers}
                />
            </div>

            <button type="submit" disabled={!submitEnabled}
                >Register Team</button
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

    h1 {
        font-size: 2.5rem;
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

    form {
        background: $background-1;
        border-radius: 1.5rem;
        border: 3px solid $border-color;
        box-shadow: $shadow;
        padding: 2rem;
    }

    .error {
        color: $red;
        background: rgba($red, 0.1);
        padding: 0.75rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        font-weight: 600;
    }

    .form-section {
        margin-bottom: 1.5rem;

        label {
            display: block;
            font-weight: 600;
            color: $text;
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
        }

        .player-count {
            font-weight: 400;
            font-size: 0.9rem;
            color: $text-muted;

            &.warning {
                color: $red;
            }
        }
    }

    input[type="text"]#team-name {
        @extend %text-input;
        font-size: 1.1rem;
        width: 100%;
        box-sizing: border-box;
    }

    button[type="submit"] {
        @extend %button;
        font-size: 1.25rem;
        width: 100%;
        padding: 0.8rem;
        margin-top: 1rem;
        background: $primary;
    }
</style>
