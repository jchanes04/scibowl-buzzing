<script lang="ts">
    export let teams = []
    export let newTeamName
    $: teamsJSON = JSON.stringify(teams)

    function addTeam() {
        if (newTeamName && !teams.includes(newTeamName)) {
            teams = [...teams, newTeamName]
        }
        newTeamName = ''
    }
</script>

<div>
    <input type="hidden" name="teams" value={teamsJSON} />
    <h4>Team List</h4>
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
            <input type="text" id="new-team" bind:value={newTeamName} />
            <span on:click={addTeam}>
                <span class="add" />
            </span>
        </li>
    </ul>
</div>

<style lang="scss">
    div {
        margin-top: 1.5em;
    }

    h4 {
        margin: 0;
    }

    ul {
        list-style: none;
        text-align: center;
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
        position: relative;
    }
</style>