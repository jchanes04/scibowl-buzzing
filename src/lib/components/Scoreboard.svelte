<script lang="ts">
    import type { IndividualTeamClean } from '$lib/classes/IndividualTeam';
    import type { TeamClean } from '$lib/classes/Team'
import { afterUpdate } from 'svelte';

    export let teamList: Array<TeamClean | IndividualTeamClean>
    export let buzzedTeamIDs: string[]

    afterUpdate(() => {
        console.log('a')
    })
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
        grid-area: scoreboard;
        padding: 1em;
        box-sizing: border-box;
        border-radius: 1em;
        background: #EEE;

        &::-webkit-scrollbar {
            width: 5px;
        }

        &::-webkit-scrollbar-button {
            display: none;
        }

        &::-webkit-scrollbar-track {
            background: transparent;
        }

        &::-webkit-scrollbar-thumb {
            background: var(--green);
            width: 5px;
            border-radius: 5px;
        }

        &::-webkit-scrollbar-track-piece:start {
            margin-top: 1.2em;
            background: transparent;
        }

        &::-webkit-scrollbar-track-piece:end {
            margin-bottom: 1.2em;
            background: transparent;
        }
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