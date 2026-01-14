<script lang="ts">
    import teamsStore from "$lib/stores/teams.svelte"
    import { playersStore } from "$lib/stores/members.svelte"
    import gameStore from "$lib/stores/game.svelte"
    import { useScoreboard } from "$lib/stores/scoreboard.svelte"

    const scoreboardQuery = useScoreboard();

    function sumQuestionScores(teamId: string) {
        if (!scoreboardQuery.data) return 0;
        const pointValues = scoreboardQuery.data.pointValues || { tossup: 4, bonus: 10, penalty: -4 };
        return Object.values(scoreboardQuery.data.scores || {}).reduce((acc: number, q: any) => {
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
        {#key playersStore.value}
            {#each Object.values(teamsStore.value) as team}
                <li class:buzzed={gameStore.value.state.currentBuzzer?.team.id == team.id}>
                    <h1>
                        <span class="team-name">{team.name}</span>
                        <span class="team-score">{sumQuestionScores(team.id)}</span>
                    </h1>
                    {#if team.type !== "individual"}
                        <ul>
                            {#each Object.values(team.players) as player}
                                <li class="player-row" class:captain={player.id === team.captainId}>
                                    {player.name}
                                </li>
                            {/each}
                        </ul>
                    {/if}
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
        padding: 1.5em;
        box-sizing: border-box;
        border-radius: 1em;
        background: $background-1;
        box-shadow: $shadow;
        border: 3px solid $border-color;
    }

    h1 {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 0;
        
        .team-name {
            font-size: 1.1rem;
            font-weight: 700;
            color: $text;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .team-score {
            font-size: 1.5rem;
            font-weight: 800;
            color: $primary;
            font-variant-numeric: tabular-nums;
        }
    }

    h2 {
        font-size: 1.5rem;
        font-weight: 800;
        margin-top: 0;
        margin-bottom: 1.25rem;
        color: $primary;
        border-bottom: 2px solid $gray-2;
        padding-bottom: 0.5rem;
    }

    ul {
        list-style: none;
        padding-left: 0px;
        display: flex;
        flex-direction: column;
        gap: 0.75em;
    }

    li {
        padding: 1.25em;
        border-radius: 1rem;
        background: $background-1;
        border: 1px solid $border-color;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        position: relative;
        overflow: hidden;
        
        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: transparent;
            transition: background 0.2s;
        }

        &.buzzed {
            border-color: $orange;
            transform: #{"scale(1.02)"};
            box-shadow: 0 10px 15px -3px rgba($orange, 0.1), 0 4px 6px -2px rgba($orange, 0.05);
            
            &::before {
                background: $orange;
            }
            
            .team-score {
                color: $orange-dark;
            }
        }
    }

    li ul {
        padding-left: 0.5em;
        margin-top: 0.25em;
        display: flex;
        flex-direction: column;
        gap: 0.25em;
    }
    
    .player-row {
        font-size: 0.95rem;
        color: $gray-2;
        display: flex;
        gap: 0.5em;
        padding: .5em;
        border-radius: .5rem;
        border: 0px solid $border-color;
        background: $background-1;
        
        &.captain {
            font-weight: 600;
            color: $primary;
        }
    }
</style>