<script lang="ts">
    import gameStore from "$lib/stores/game"
    import teamsStore from "$lib/stores/teams"
    import playersStore from "$lib/stores/players"
    import { createEventDispatcher } from "svelte";
    import type { Category, ScoreType } from "$lib/classes/Game";

    const dispatch = createEventDispatcher()

    $: rowNumber = Math.max(...Object.keys($gameStore.scores).map(Number))
    $: rowArray = Array.from({length: rowNumber}, (_, i) => i + 1)
    $: players = {
        ...Object.values($gameStore.scores).reduce((acc, s) => {
            for (const t of Object.keys(s.tossup)) {
                if (!acc[t]) {
                    acc[t] = [s.tossup[t].playerId]
                } else if (!acc[t].includes(s.tossup[t].playerId)) {
                    acc[t].push(s.tossup[t].playerId)
                }
            }
            return acc
        }, {} as Record<string, string[]>),
        ...Object.entries($teamsStore).reduce((acc, [teamId, team]) => {
            if (!Object.values($gameStore.scores).some(s => s.tossup[teamId])) {
                acc[teamId] = Object.keys(team.players)
                return acc
            } else {
                return acc
            }
        }, {} as Record<string, string[]>)
    }

    const categories: Record<Category, string> = {
        "bio": "B",
        "earth": "ES",
        "chem": "C",
        "physics": "P",
        "math": "M",
        "energy": "EN"
    }

    const scoreTypes: Record<ScoreType, string> = {
        "correct": "C",
        "incorrect": "I",
        "penalty": "P"
    }
</script>

<div>
    <button on:click={() => dispatch('close')}>Close</button>
    <table>
        <colgroup>
            <col span="2" class="question-info" />
        </colgroup>
        <tr>
            <th colspan="2"></th>
            {#each Object.keys(players) as teamId}
                <th colspan={players[teamId].length + 1} style:font-weight="bold">{$teamsStore[teamId].name}</th>
            {/each}
        </tr>
        <tr>
            <th colspan="2"></th>
            {#each Object.values(players) as p}
                {#each p as playerId}
                    <th class="player-name" style:font-weight="normal">{$playersStore[playerId]?.name || "Unknown"}</th>
                {/each}
                <th class="player-name" style:font-weight="bold">Bonus</th>
            {/each}
        </tr>
        {#each rowArray as i}
            <tr>
                <td>#{i}</td>
                {#if $gameStore.scores[i]}
                    <td>{categories[$gameStore.scores[i].category]}</td>
                    {#each Object.entries(players) as [teamId, p]}
                        {#each p as playerId}
                            {#if $gameStore.scores[i].tossup[teamId]?.playerId === playerId}
                                <td class="{$gameStore.scores[i].tossup[teamId].scoreType}">
                                    {scoreTypes[$gameStore.scores[i].tossup[teamId].scoreType]}
                                </td>
                            {:else}
                                <td></td>
                            {/if}
                        {/each}
                        {#if $gameStore.scores[i].bonus?.teamId === teamId}
                            <td class="bonus {$gameStore.scores[i].bonus?.correct ? "correct" : "incorrect"}">
                                {$gameStore.scores[i].bonus?.correct ? "C" : "I"}
                            </td>
                        {:else}
                            <td class="bonus"></td>
                        {/if}
                    {/each}
                {:else}
                    <td></td>
                    {#each Object.values(players) as p}
                        {#each p as _}
                            <td></td>
                        {/each}
                        <td class="bonus"></td>
                    {/each}
                {/if}
            </tr>
        {:else}
            <tr>
                <td colspan="2"></td>
                <td colspan={Object.values(players).reduce((acc, x) => acc + x.length + 1, 0)}>
                    No questions
                </td>
            </tr>
        {/each}
    </table>
</div>

<style lang="scss">
    div {
        overflow: auto;
        background: #EEE;
        border-radius: 1em;
        padding: 2em;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
    }

    table {
        border-collapse: collapse;
        border: 1px solid black;
    }

    th {
        border: 1px solid black;
        padding: 0.3em;

        &.player-name {
            writing-mode: vertical-lr;
            transform: rotate(180deg);
            padding: 0.2em;
        }
    }

    .question-info {
        border-top: 1px solid #333;
        border-right: 1px solid black;
        border-bottom: 1px solid #333;
        border-left: 1px solid black;
    }

    tr td {
        border: 1px solid #BBB;
    }

    td {
        text-align: center;
        padding: 0.1em 0.2em;

        &.bonus {
            border-right: 1px solid black;
        }

        &.correct {
            background: var(--green);
        }

        &.incorrect {
            background: var(--red);
        }

        &.penalty {
            background: var(--red);
        }
    }
</style>