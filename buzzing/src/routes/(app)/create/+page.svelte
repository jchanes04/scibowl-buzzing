<script lang="ts">
    import { enhance } from "$app/forms";
    import TeamList from "$lib/components/TeamList.svelte";
    import { user } from "$lib/stores/auth";
    import CollapsibleSection from "$lib/components/CollapsibleSection.svelte";

    interface Props {
        form?: { message?: string };
    }

    let { form }: Props = $props();

    const errors = {} as Record<string, string>;

    let newTeamsAllowed = $state(false);
    let individualTeamsAllowed = $state(false);
    let ownerName = $state("");
    let gameName = $state("");
    let defaultTeams = $state<string[]>([]);
    let newTeamName = $state("");

    // Timer settings (default values from Game.ts, extra time is always 2 seconds)
    let tossupTime = $state(5);
    let bonusTime = $state(20);
    let visualTime = $state(30);

    let teamSettingsOpen = $state(false);
    let defaultTeamsOpen = $state(true);
    let gameSettingsOpen = $state(false);

    // Point value settings (default values from GameScoreboard.ts)
    let tossupPoints = $state(4);
    let bonusPoints = $state(10);
    let penaltyPoints = $state(-4);

    // Auto-populate owner name from user profile on page load
    let hasAutoPopulated = $state(false);
    $effect(() => {
        if (!hasAutoPopulated) {
            user.subscribe((currentUser) => {
                if (currentUser && !ownerName) {
                    // Use username by default, fallback to firstName
                    const displayName =
                        currentUser.username || currentUser.firstName;
                    if (displayName) {
                        ownerName = displayName;
                        hasAutoPopulated = true;
                    }
                }
            });
        }
    });
    let submitEnabled = $derived(
        ownerName &&
            gameName &&
            !(
                !individualTeamsAllowed &&
                !newTeamsAllowed &&
                defaultTeams.length === 0
            ),
    );

    function handleSubmit() {
        if (newTeamName) defaultTeams = [...defaultTeams, newTeamName];
        newTeamName = "";
    }
</script>

<svelte:head>
    <title>Create Game</title>
</svelte:head>

<main>
    <h1>Create Game</h1>
    <form
        id="form"
        method="POST"
        autocomplete="off"
        onsubmit={handleSubmit}
        use:enhance
    >
        {#if form?.message}
            <p class="error">{errors[form.message] || form.message}</p>
        {/if}

        <input
            type="text"
            placeholder="Game Name"
            name="game-name"
            id="game-name-input"
            bind:value={gameName}
        />
        <br />
        <input
            type="text"
            placeholder="Your Name"
            name="owner-name"
            id="owner-name-input"
            bind:value={ownerName}
        />
        <br />

        <CollapsibleSection title="Team Settings" bind:open={teamSettingsOpen}>
            <div class="checkbox-wrapper">
                <label for="new-teams">
                    <input
                        id="new-teams"
                        type="checkbox"
                        name="new-teams-allowed"
                        bind:checked={newTeamsAllowed}
                    />
                    <span></span>
                    Members can create their own teams that others can join
                </label>
                <label for="individual-teams">
                    <input
                        id="individual-teams"
                        type="checkbox"
                        name="individual-teams-allowed"
                        bind:checked={individualTeamsAllowed}
                    />
                    <span></span>
                    Members can join the game on a team of just themselves
                </label>
                <label for="spectators">
                    <input
                        id="spectators"
                        type="checkbox"
                        name="spectators-allowed"
                    />
                    <span></span>
                    Spectators allowed
                </label>
            </div>
        </CollapsibleSection>

        <CollapsibleSection title="Default Teams" bind:open={defaultTeamsOpen}>
            <TeamList bind:teams={defaultTeams} bind:newTeamName />
        </CollapsibleSection>

        <CollapsibleSection title="Game Settings" bind:open={gameSettingsOpen}>
            <h3 class="sub-heading">Timer Lengths</h3>
            <div class="timer-grid">
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

            <h3 class="sub-heading">Point Values</h3>
            <div class="points-grid">
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

        <button type="submit" disabled={!submitEnabled}>Create Game</button>
    </form>
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

    .error {
        color: $red;
        background: rgba($red, 0.1);
        padding: 0.75rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        font-weight: 600;
    }

    .checkbox-wrapper {
        text-align: left;
        display: block;

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

    input[type="text"] {
        @extend %text-input;
        font-size: 1.1rem;
        width: 90%;
        text-align: left;
        margin-bottom: 1rem;
    }

    .sub-heading {
        font-size: 1.05rem;
        font-weight: 600;
        color: $text;
        text-align: left;
        margin-top: 1.25rem;
        margin-bottom: 0;

        &:first-child {
            margin-top: 0;
        }
    }

    .timer-grid,
    .points-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 1.5rem;
        margin-top: 1rem;

        @media (max-width: 600px) {
            grid-template-columns: 1fr;
        }
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

    button[type="submit"] {
        @extend %button;
        font-size: 1.25rem;
        width: 90%;
        padding: 0.8rem;
        margin-top: 2rem;
        background: $primary;
    }
</style>
