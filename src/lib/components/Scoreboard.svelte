<script lang="ts">
    import type { IndividualTeamClean } from '$lib/classes/IndividualTeam';
    import type { TeamClean } from '$lib/classes/Team'

    export let teamList: Array<TeamClean | IndividualTeamClean>
</script>

<div>
    <h3>Scoreboard</h3>
    <ul>
        {#each teamList as team}
            <li>
                {team.name + ": " + team.scoreboard.score}
                {#if !team.individual}
                    <ul>
                        {#each team.members as member}
                            <li>{member.name}</li>
                        {/each}
                    </ul>
                {/if}
            </li>
        {/each}
    </ul>
</div>

<style>
    div {
        min-height: 200px;
        max-height: 400px;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        border-top-style: solid;
        grid-area: scoreboard;
    }
    ul {
        list-style: none;
        padding-left: 0px;
    }
    li ul {
        padding-left: 1em;
    }
</style>