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

<form id="form" action="/create" method="POST" autocomplete="off" on:submit={handleSubmit}>
    <h2>Create Game</h2>
    <input type="text" placeholder="Game Name" name="game-name" id="game-name-input" bind:value={gameName} />
    <br />
    <input type="text" placeholder="Your Name" name="owner-name" id="owner-name-input" bind:value={ownerName} />
    <br />

    <h3>Teams</h3>
    <div class="radio-wrapper">
        <input id="any-teams" type="radio" name="team-format" value="any" bind:group={teamFormat} />
        <label for="any-teams">Individuals or Teams</label>
        <br />
        <input id="individual-teams" type="radio" name="team-format" value="individuals" bind:group={teamFormat} />
        <label for="individual-teams">Only Individuals</label>
        <br />
        <input id="group-teams" type="radio" name="team-format" value="teams" bind:group={teamFormat} />
        <label for="group-teams">Only Teams</label>
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
        width: 80ch;
        border-radius: 1em;
        text-align: center;
        padding: 1em;
        position: relative;
    }

    h2 {
        font-size: 44px;
        text-decoration: underline #0061c3 3px;
        text-underline-offset: 0.2em;
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
        text-align: center;
        position: relative;

        &:focus::placeholder {
            color: transparent;
        }
    }

    button {
        
    }
</style>