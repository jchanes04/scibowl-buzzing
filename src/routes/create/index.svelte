<script lang="ts">
    import { session } from "$app/stores"
    let teamFormat
    let ownerName
    let gameName
    let teams = []
    $: submitEnabled = ownerName && gameName && teamFormat && (teamFormat !== "teams" || teams.length !== 0)

    import TeamList from '$lib/components/TeamList.svelte'

    function handleSubmit() {
        $session.memberName = ownerName
    }
</script>

<svelte:head>
    <title>Create Game</title>
</svelte:head>

<form id="form" action="/create" method="POST" autocomplete="off" on:submit={handleSubmit}>
    <h1>Create Game</h1>
    <input type="text" placeholder="Game Name" name="game-name" id="game-name-input" bind:value={gameName} />
    <br />
    <input type="text" placeholder="Your Name" name="owner-name" id="owner-name-input" bind:value={ownerName} />
    <br />

    <h2>Teams</h2>
    <div class="radio-wrapper">
        <label for="any-teams">
            <input id="any-teams" type="radio" name="team-format" value="any" bind:group={teamFormat} />
            <span />
            Individuals or Teams
        </label>
        <br />
        <label for="individual-teams">
            <input id="individual-teams" type="radio" name="team-format" value="individuals" bind:group={teamFormat} />
            <span />
            Only Individuals
        </label>
        <br />
        <label for="group-teams">
            <input id="group-teams" type="radio" name="team-format" value="teams" bind:group={teamFormat} />
            <span />
            Only Teams
        </label>
        <br />
    </div>
    <br />
    {#if teamFormat === "teams"}
        <TeamList bind:teams={teams} />
    {/if}
    <br />
    <button type="submit" disabled={!submitEnabled}>Create Game</button>
</form>

<style lang="scss">
    form {
        margin: 3em auto;
        border-radius: 1em;
        text-align: center;
        padding: 1em;
        position: relative;
    }

    h1 {
        font-size: 44px;
        text-decoration: underline var(--blue) 3px;
        text-underline-offset: 0.2em;
    }

    h2 {
        font-size: 24px;
        text-decoration: underline var(--blue) 2px;
        text-underline-offset: 0.1em;
    }

    .radio-wrapper {
        text-align: left;
        display: inline-block;
    }

    input[type="text"] {
        padding: 0.3em;
        font-size: 24px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        width: 25ch;
        max-width: 80vw;
        text-align: center;
        position: relative;

        &:focus::placeholder {
            color: transparent;
        }
    }

    label {
        cursor: pointer;
        padding-top: 0.3em;
        padding-bottom: 0.3em;
        display: inline-block;

        input {
            visibility: hidden;
            width: 0;
            height: 0;
        }

        span {
            width: 1em;
            height: 1em;
            border-radius: 50%;
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
                width: 0.7em;
                height: 0.7em;
                border-radius: 0.35em;
                background: var(--blue);
            }
        }

        &:hover > span {
            border-color: var(--green);
        }

        input:checked ~ span::after {
            display: inline-block;
        }
    }

    button {
        padding: 0.5em;
        color: #EEE;
        background: var(--green);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 18px;
        cursor: pointer;

        &:disabled {
            padding: calc(0.5em - 3px);
            border: solid var(--green) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }
    }
</style>