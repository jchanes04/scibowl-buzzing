<script lang="ts">
    import type { IndividualTeamClean } from '$lib/classes/IndividualTeam';
    import type { TeamClean } from '$lib/classes/Team'

    export let teamList: Array<TeamClean | IndividualTeamClean>
    export let buzzedTeamIDs: string[]
</script>

<div>
    <h3>Scoreboard</h3>
    <ul>
        {#each teamList as team}
            {#if team.members.length !== 1 || !team.members[0].reader}
                <li class={buzzedTeamIDs.includes(team.id) ? "buzzed" : ""}>
                    {team.name + ": " + team.scoreboard.score}
                    {#if !team.individual}
                        <ul>
                            {#each team.members as member}
                                <li>{member.name}</li>
                            {/each}
                        </ul>
                    {/if}
                </li>
            {/if}
        {/each}
    </ul>
</div>

<style lang="scss">
    div {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        border-top: solid 2px;
        border-left: solid 1px;
        border-right: solid 1px;
        border-bottom: solid 1px;
        grid-area: scoreboard;
        box-sizing: border-box;
        padding: 1em;
    }

    ul {
        list-style: none;
        padding-left: 0px;
    }

    li ul {
        padding-left: 1em;
        color: inherit;
    }

    ul .buzzed {
        color: #333;
    }
</style>