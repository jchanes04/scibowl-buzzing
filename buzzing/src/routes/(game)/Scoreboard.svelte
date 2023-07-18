<script lang="ts">
    import teamsStore from "$lib/stores/teams"
    import playersStore from "$lib/stores/players"
    import gameStore from "$lib/stores/game"
    import type { QuestionPairScore } from "$lib/classes/GameScoreboard";

    const pointValues = {
        tossup: 4,
        bonus: 10,
        penalty: -4
    }

    function sumQuestionScores(scores: Record<number, QuestionPairScore>, teamId: string) {
        return Object.values(scores).reduce((acc, q) => {
            if (q.tossup[teamId]?.scoreType === "correct") {
                acc += pointValues.tossup 
            } else if (q.tossup[teamId]?.scoreType === "penalty") {
                acc += pointValues.penalty
            }

            if (q.bonus?.teamId === teamId && q.bonus?.correct) {
                acc += pointValues.bonus
            }
            return acc
        }, 0)
    }
</script>

<div class="scoreboard">
    <h2>Scoreboard</h2>
    <ul>
        {#key $playersStore}
            {#each Object.values($teamsStore) as team}
                <li class:buzzed={$gameStore.state.buzzedTeamIds.includes(team.id)}>
                    <h1><span style="font-weight:200;">{team.name} –</span> {sumQuestionScores($gameStore.scores, team.id)}</h1>
                    {#if team.type !== "individual"}
                        <ul>
                            {#each Object.values(team.players) as player}
                                <li class:captain={player.id === team.captainId} style="margin-left:.75em; font-size:20px;">
                                    {player.name}
                                </li>
                            {/each}
                        </ul>
                        
                    {/if}
                    <br>
                </li>
            {/each}
        {/key}
    </ul>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    .scoreboard {
        @include vertical-scrollable();

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
        background: $background-1;
    }
    h1{
        font-size: 30px;
        margin-left: 0.5em;
        margin-top:.25em;
        margin-bottom:0;
    }

    h2 {
        font-size: 26px;
        margin-top: 0.25em;
        margin-left: 0.5em;
        margin-bottom:0;
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
        text-decoration: underline;
    }

    .captain::after {
        content: '*';
    }
</style>