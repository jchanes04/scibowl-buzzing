<script lang="ts">
    export let teams = []
    $: teamsJSON = JSON.stringify(teams)

    function addTeam() {
        let input = <HTMLInputElement>document.getElementById('new-team')
        if (input.value && !teams.includes(input.value)) {
            teams = [...teams, input.value]
        }
        input.value = ''
    }
</script>

<div>
    <input type="hidden" name="teams" value={teamsJSON} />
    <h4>Team List</h4>
    <ul>
        {#each teams as team}
            <li>
                <span on:click={() => {teams = teams.filter(x => x !== team)}}>❌</span>
                {team}
            </li>
        {/each}
        <li>
            <input type="text" id="new-team" />
            <span on:click={addTeam}>✔️</span>
        </li>
    </ul>
</div>

<style lang="scss">
    div {
        display: inline-block;
        margin-top: 1.5em;
    }

    h4 {
        margin: 0;
    }

    ul {
        list-style: none;
    }

    li span {
        width: 1em;
        height: 1em;
    }
</style>