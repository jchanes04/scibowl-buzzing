<script lang="ts">
    import teamsStore from "$lib/stores/teams"
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
        {#each Object.values($teamsStore) as team}
            <li class:buzzed={$gameStore.state.buzzedTeamIds.includes(team.id)}>
                {team.name + ": " + sumQuestionScores($gameStore.scores, team.id)}
                {#if team.type !== "individual"}
                    <ul>
                        {#each Object.values(team.players) as player}
                            <li class:captain={player.id === team.captainId}>
                                {player.name}
                            </li>
                        {/each}
                    </ul>
                {/if}
            </li>
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
        text-decoration: underline;
    }

    .captain::after {
        content: '*';
    }
</style>