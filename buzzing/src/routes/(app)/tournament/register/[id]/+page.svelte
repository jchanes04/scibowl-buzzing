<script lang="ts">
    import { enhance } from "$app/forms";
    import { goto } from "$app/navigation";
    import type { PageData, ActionData } from "./$types";
    import LoginButton from "$lib/components/LoginButton.svelte";
    import MultiNameInput from "$lib/components/MultiNameInput.svelte";
    import { Pencil, Plus } from "lucide-svelte";

    interface Props {
        data: PageData;
        form: ActionData;
    }

    let { data, form }: Props = $props();
    let tournament = $derived(data.tournament);
    let isAuthenticated = $derived(data.isAuthenticated);
    let userTeams = $derived(data.userTeams);
    let editingTeam = $derived(data.editingTeam);

    // Form mode: 'select' | 'register' | 'edit'
    let mode = $derived.by(() => {
        if (editingTeam) return "edit";
        if (userTeams && userTeams.length > 0) return "select";
        return "register";
    });

    // Show form when registering new team or editing
    let showForm = $state(false);

    // Initialize showForm based on mode
    $effect(() => {
        if (mode === "register" || mode === "edit") {
            showForm = true;
        } else {
            showForm = false;
        }
    });

    // Form state - initialize from editing team if available
    let teamName = $state("");
    let players = $state<string[]>([]);
    let newPlayerName = $state("");

    // Initialize form when editing
    $effect(() => {
        if (editingTeam) {
            teamName = editingTeam.name;
            players = [...editingTeam.players];
        }
    });

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

    function startNewRegistration() {
        teamName = "";
        players = [];
        newPlayerName = "";
        showForm = true;
        // Navigate without edit param
        goto(`/tournament/register/${tournament.id}`, { replaceState: true });
    }

    function editTeam(teamId: string) {
        goto(`/tournament/register/${tournament.id}?edit=${teamId}`);
    }

    function cancelEdit() {
        if (userTeams && userTeams.length > 0) {
            showForm = false;
            goto(`/tournament/register/${tournament.id}`, {
                replaceState: true,
            });
        }
    }
</script>

<svelte:head>
    <title>{editingTeam ? "Edit Team" : "Register"} for {tournament.name}</title
    >
</svelte:head>

<main>
    <h1>{editingTeam ? "Edit Team" : "Register"} for {tournament.name}</h1>

    {#if tournament.bracketConfirmed}
        <div class="closed-notice">
            <p>Registration is closed - the bracket has been confirmed.</p>
            <a href="/tournament/{tournament.id}" class="back-link"
                >Back to Tournament</a
            >
        </div>
    {:else if !isAuthenticated}
        <div class="login-prompt">
            <p>You must be logged in to register a team.</p>
            <LoginButton />
        </div>
    {:else if mode === "select" && !showForm}
        <!-- User has registered teams, show selection -->
        <div class="team-selection">
            <h2>Your Registered Teams</h2>
            <p class="selection-hint">
                Click a team to edit it, or register a new team.
            </p>

            <div class="teams-list">
                {#each userTeams ?? [] as team}
                    <button
                        class="team-card"
                        onclick={() => editTeam(team.teamId)}
                        type="button"
                    >
                        <div class="team-info">
                            <span class="team-name">{team.name}</span>
                            <span class="player-count"
                                >{team.players.length} players</span
                            >
                        </div>
                        <Pencil size={18} />
                    </button>
                {/each}
            </div>

            <button
                class="new-team-btn"
                onclick={startNewRegistration}
                type="button"
            >
                <Plus size={18} />
                Register New Team
            </button>
        </div>
    {:else}
        <!-- Registration or Edit form -->
        <form
            method="POST"
            action={editingTeam ? "?/update" : "?/register"}
            autocomplete="off"
            use:enhance
        >
            {#if form?.message}
                <p class="error">{form.message}</p>
            {/if}

            {#if editingTeam}
                <input
                    type="hidden"
                    name="team-id"
                    value={editingTeam.teamId}
                />
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

            <div class="form-actions">
                <button type="submit" disabled={!submitEnabled}>
                    {editingTeam ? "Save Changes" : "Register Team"}
                </button>
                {#if userTeams && userTeams.length > 0}
                    <button
                        type="button"
                        class="cancel-btn"
                        onclick={cancelEdit}
                    >
                        Cancel
                    </button>
                {/if}
            </div>
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

    .login-prompt,
    .closed-notice {
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

    .back-link {
        @extend %button;
        display: inline-block;
        background: $primary;
        text-decoration: none;
    }

    .team-selection {
        background: $background-1;
        border-radius: 1.5rem;
        border: 3px solid $border-color;
        box-shadow: $shadow;
        padding: 2rem;

        h2 {
            font-size: 1.5rem;
            font-weight: 700;
            color: $text;
            margin: 0 0 0.5rem 0;
        }

        .selection-hint {
            color: $text-muted;
            margin-bottom: 1.5rem;
        }
    }

    .teams-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
    }

    .team-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: $background-2;
        border: 2px solid $border-color;
        border-radius: 0.75rem;
        padding: 1rem 1.25rem;
        cursor: pointer;
        transition: all 0.2s;
        width: 100%;
        text-align: left;

        &:hover {
            border-color: $primary;
            background: $background-1;
        }

        .team-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .team-name {
            font-weight: 700;
            font-size: 1.1rem;
            color: $text;
        }

        .player-count {
            font-size: 0.9rem;
            color: $text-muted;
        }

        :global(svg) {
            color: $text-muted;
            flex-shrink: 0;
        }

        &:hover :global(svg) {
            color: $primary;
        }
    }

    .new-team-btn {
        @extend %button;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        background: $primary;
        font-size: 1rem;
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

    .form-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1rem;
    }

    button[type="submit"] {
        @extend %button;
        font-size: 1.25rem;
        flex: 1;
        padding: 0.8rem;
        background: $primary;
    }

    .cancel-btn {
        @extend %button;
        font-size: 1.25rem;
        padding: 0.8rem 1.5rem;
        background: $gray-2;
    }
</style>
