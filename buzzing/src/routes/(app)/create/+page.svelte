<script lang="ts">
    import { enhance } from '$app/forms';
    import TeamList from '$lib/components/TeamList.svelte'
    import type { ActionData } from './$types';

    export let form: ActionData

    const errors = {
        "InvalidTournamentCode": "The provided tournament code is invalid"
    } as Record<string, string>

    let newTeamsAllowed: boolean = false
    let individualTeamsAllowed: boolean
    let inTournament: boolean
    let tournamentCode: string
    let ownerName: string
    let gameName: string
    let defaultTeams: string[] = []
    let newTeamName: string
    $: submitEnabled = ownerName
        && gameName
        && !(!individualTeamsAllowed && !newTeamsAllowed && defaultTeams.length === 0)
        && !(inTournament && !tournamentCode)

    function handleSubmit() {
        if (newTeamName)
            defaultTeams = [...defaultTeams, newTeamName]
        newTeamName = ''
    }
</script>

<svelte:head>
    <title>Create Game</title>
</svelte:head>

<main>
    <h1>Create Game</h1>
    <form id="form" method="POST" autocomplete="off" on:submit={handleSubmit} use:enhance>
        {#if form?.message}
            <p class="error">{errors[form.message] || form.message}</p>
        {/if}
    
        <input type="text" placeholder="Game Name" name="game-name" id="game-name-input" bind:value={gameName} />
        <br />
        <input type="text" placeholder="Your Name" name="owner-name" id="owner-name-input" bind:value={ownerName} />
        <br />
    
        <h2>Team Settings</h2>
        <div class="checkbox-wrapper">
            <label for="new-teams">
                <input id="new-teams" type="checkbox" name="new-teams-allowed" bind:checked={newTeamsAllowed} />
                <span />
                Members can create their own teams that others can join
            </label>
            <label for="individual-teams">
                <input id="individual-teams" type="checkbox" name="individual-teams-allowed" bind:checked={individualTeamsAllowed} />
                <span />
                Members can join the game on a team of just themselves
            </label>
            <label for="spectators">
                <input id="spectators" type="checkbox" name="spectators-allowed" />
                <span />
                Spectators allowed
            </label>
            <label for="tournament-checkbox">
                <input id="tournament-checkbox" type="checkbox" name="in-tournament" bind:checked={inTournament} />
                <span />
                Add game to tournament
            </label>
            {#if inTournament}
                <div style:text-align="center">
                    <input type="text" placeholder="Tournament Code" name="tournament-code" id="tournament-code-input" bind:value={tournamentCode} />
                </div>
            {/if}
        </div>
        <h2 style="margin-bottom: 0rem">Default Teams</h2>
        <TeamList bind:teams={defaultTeams} bind:newTeamName={newTeamName} />
        <br />
        <button type="submit" disabled={!submitEnabled}>Create Game</button>
    </form>
</main>

<style lang="scss">
    @use '$styles/_global.scss' as *;

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
        color: $text-dark;
        text-align: center;
        text-decoration: underline var(--primary) 3px;
        text-underline-offset: 0.2em;
    }

    h2 {
        font-size: 1.25rem;
        font-weight: 700;
        margin-top: 1.5rem;
        margin-bottom: .5rem;
        color: $primary;
        text-align: left;
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
                    content: '';
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

    button[type="submit"] {
        @extend %button;
        font-size: 1.25rem;
        width: 90%;
        padding: 0.8rem;
        margin-top: 2rem;
        background: $primary;
    }
</style>