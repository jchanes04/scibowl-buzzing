<script lang="ts">
    import type { TeamData } from '$lib/classes/Team'

    export let teamList: TeamData[]
    export let buzzedTeamIDs: string[]
</script>

<div class="scoreboard">
    <h2>Scoreboard</h2>
    <ul>
        {#each teamList as team}
            {#if team.members.length !== 1 || !team.members[0].moderator}
                <li class:buzzed={buzzedTeamIDs.includes(team.id)}>
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
    .scoreboard {
        height: 100%;
        min-height: 10em;
        max-height: 25em;
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

    h2 {
        font-size: 26px;
        margin-top: 0.25em;
        margin-left: 0.5em;
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