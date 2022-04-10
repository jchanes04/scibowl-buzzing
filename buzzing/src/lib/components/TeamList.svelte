<script lang="ts">
    export let teams: string[] = []
    export let newTeamName: string
    $: teamsJSON = JSON.stringify(teams)

    function addTeam() {
        if (newTeamName && !teams.includes(newTeamName)) {
            teams = [...teams, newTeamName]
        }
        newTeamName = ''
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.code === "Enter" || e.keyCode === 13) {
            addTeam()
        }
    }

    function handleInput() {
        if (newTeamName.length > 30) {
            newTeamName = newTeamName.slice(0, 30)
        }
    }
</script>

<div>
    <input type="hidden" name="teams" value={teamsJSON} />
    <ul>
        {#each teams as team}
            <li>
                <span on:click={() => {teams = teams.filter(x => x !== team)}}>
                    <span class="remove" />
                </span>
                {team}
            </li>
        {/each}
        <li>
            <input type="text" id="default-team-name" bind:value={newTeamName} on:input={handleInput} />
            <span on:click={addTeam}>
                <span class="add" />
            </span>
        </li>
    </ul>
</div>

<svelte:body on:keydown={handleKeydown}></svelte:body>

<style lang="scss">

    ul {
        list-style: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0;
    }

    li {
        margin-top: 0.3em;
        margin-bottom: 0.3em;
    }

    li > span {
        width: 1em;
        height: 1em;
        display: inline-block;
        cursor: pointer;
        vertical-align: middle;

        span {
            width: 100%;
            height: 100%;
            display: inline-block;
        }
    }

    .add {
        background: hsl(210, 100%, 38%);
        clip-path: polygon(0 40%, 40% 40%, 40% 0, 60% 0, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0 60%);
        margin-left: 0.2em;
        float: right;
    }

    .remove {
        clip-path: polygon(15% 0, 0 15%, 35% 50%, 0 85%, 15% 100%, 50% 65%, 85% 100%, 100% 85%, 65% 50%, 100% 15%, 85% 0, 50% 35%);
        background: var(--red);
        margin-right: 0.5em;
    }

    input[type="text"] {
        padding: 0.3em;
        font-size: 16px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        width: 25ch;
        text-align: center;
        font-family: 'Ubuntu';
        position: relative;
    }
</style>