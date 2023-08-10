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
            <br />
            <label for="individual-teams">
                <input id="individual-teams" type="checkbox" name="individual-teams-allowed" bind:checked={individualTeamsAllowed} />
                <span />
                Members can join the game on a team of just themselves
            </label>
            <br />
            <label for="spectators">
                <input id="spectators" type="checkbox" name="spectators-allowed" />
                <span />
                Spectators allowed
            </label>
            <br />
            <label for="tournament-checkbox">
                <input id="tournament-checkbox" type="checkbox" name="in-tournament" bind:checked={inTournament} />
                <span />
                Add game to tournament
            </label>
            {#if inTournament}
                <br />
                <div style:text-align="center">
                    <input type="text" placeholder="Tournament Code" name="tournament-code" id="tournament-code-input" bind:value={tournamentCode} />
                </div>
            {/if}
            <br />
            <br />
        </div>
        <br />
        <label for="default-team-name"><h2>Default Teams</h2></label>
        <TeamList bind:teams={defaultTeams} bind:newTeamName={newTeamName} />
        <br />
        <button type="submit" disabled={!submitEnabled}>Create Game</button>
    </form>
</main>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    form {
        margin: 0em auto;
        border-radius: 1em;
        text-align: center;
        padding: 1em;
        position: relative;
    }

    h1 {
        font-size: 44px;
        text-decoration: underline $blue 3px;
        text-underline-offset: 0.2em;
        text-align: center;
    }

    h2 {
        font-size: 24px;
        text-decoration: underline $blue 2px;
        text-underline-offset: 0.1em;
    }

    .error {
        color: $red;
    }

    .checkbox-wrapper {
        text-align: left;
        display: inline-block;
    }

    input[type="text"] {
        @extend %text-input;

        font-size: 24px;
        margin: 0.5em auto;
        width: 25ch;
        max-width: 80vw;
        text-align: center;
    }

    label {
        cursor: pointer;
        padding-top: 0.3em;
        padding-bottom: 0.3em;
        display: inline-block;

        h2 {
            margin: 0;
        }

        input {
            visibility: hidden;
            width: 0;
            height: 0;
        }

        span {
            width: 1em;
            height: 1em;
            border-radius: 0.2em;
            border: #CCC 2px solid;
            display: inline-block;
            position: relative;
            background: #FFF;
            vertical-align: text-top;
            margin-right: 0.3em;

            &::after {
                content: '';
                position: absolute;
                display: none;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 0.6em;
                height: 0.6em;
                border-radius: 0.1em;
                background: var(--blue);
            }
        }

        &:hover > span {
            border-color: $green;
        }

        input:checked ~ span::after {
            display: inline-block;
        }
    }

    button {
        @extend %button;

        font-size: 18px;
    }
</style>