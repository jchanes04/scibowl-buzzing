<script lang="ts">
    import gameStore from "$lib/stores/game"
    import teamsStore from "$lib/stores/teams"
    import playersStore from "$lib/stores/players"
    import type { Category, ScoreType } from "$lib/classes/Game";
    import { convertToCSV } from "$lib/functions/scoreboard";

    $: rowNumber = Math.max(...Object.keys($gameStore.scores).map(Number))
    $: rowArray = Array.from({length: rowNumber}, (_, i) => i + 1)
    $: playersFromScores = Object.values($gameStore.scores).reduce((acc, s) => {
            for (const t of Object.keys(s.tossup)) {
                if (!acc[t]) {
                    acc[t] = [s.tossup[t]!.playerId]
                } else if (!acc[t]!.includes(s.tossup[t]!.playerId)) {
                    acc[t]!.push(s.tossup[t]!.playerId)
                }
            }
            return acc
        }, {} as Record<string, string[]>)
    $: playersFromTeams = Object.entries($teamsStore).reduce((acc, [teamId, team]) => {
            acc[teamId] = Object.keys(team.players)
            return acc
        }, {} as Record<string, string[]>)
    $: players = combinePlayersLists(playersFromScores, playersFromTeams)
    $: runningScores = (() => {
            // Compute running total for each team row by row.
            let totals: Record<string, number> = {};
            let scoreHistory: Record<number, Record<string, number>> = {};
            Object.entries($gameStore.scores).forEach(([rowNumStr, row]) => {
                const i = Number(rowNumStr);
                // Copy previous
                totals = { ...totals };
                if (row) {
                    // Tossups
                    for (const [teamId, entry] of Object.entries(row.tossup)) {
                        if (!totals[teamId]) totals[teamId] = 0;
                        if (entry.scoreType === "correct") totals[teamId] += 4;
                        else if (entry.scoreType === "incorrect") totals[teamId] -= 1;
                        else if (entry.scoreType === "penalty") totals[teamId] -= 4;
                    }
                    // Bonus
                    if (row.bonus && row.bonus.teamId) {
                        if (!totals[row.bonus.teamId]) totals[row.bonus.teamId] = 0;
                        totals[row.bonus.teamId] += row.bonus.correct ? 10 : 0;
                    }
                }
                scoreHistory[i] = { ...totals };
            });
            return scoreHistory;
        })()

    function combinePlayersLists(list1: Record<string, string[]>, list2: Record<string, string[]>) {
        const list: Record<string, string[]> = {}
        const keys = new Set([...Object.keys(list1), ...Object.keys(list2)])
        for (const teamId of keys) {
            list[teamId] = [...(list1[teamId] || []), ...(list2[teamId] || []).filter(x => !(list1[teamId] || []).includes(x))]
        }
        return list
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

    async function exportScores() {
        const csv = await convertToCSV($teamsStore, $playersStore, players, $gameStore.scores)
        const url = window.URL.createObjectURL(new Blob([csv], { type: "plain/text" }))
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'scores.csv'
        document.body.appendChild(a)
        a.click()
        URL.revokeObjectURL(url)
    }

    const pointValues = {
        tossup: 4,
        bonus: 10,
        penalty: -4
    }

    function sumQuestionScores(teamId: string) {
        return Object.values($gameStore.scores).reduce((acc, q) => {
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
    <table>
        <colgroup>
            <col span="2" class="question-info" />
        </colgroup>
        <tr>
            <th colspan="2"></th>
            {#each Object.keys(players) as teamId}
                {@const teamPlayers = players[teamId]}
                {#if teamPlayers}
                    <th colspan={teamPlayers.length + 2} class="team-name"><span>{$teamsStore[teamId]?.name || teamId}</span>: {sumQuestionScores(teamId)}</th>
                {/if}
            {/each}
        </tr>
        {#if rowArray.length}
            <tr>
                <th colspan="2"></th>
                {#each Object.values(players) as p}
                    {#each p as playerId}
                        <th class="player-name" style:font-weight="normal">{$playersStore[playerId]?.name || "Unknown"}</th>
                    {/each}
                    <th class="player-name" style:font-weight="bold">Bonus</th>
                    <th class="player-name" style:font-weight="bold">Score</th>
                {/each}
            </tr>
        {/if}
        {#each rowArray as i}
            {@const scoreRow = $gameStore.scores[i]}
            <tr>
                <td>#{i}</td>
                {#if scoreRow}
                    <td>{categories[scoreRow.category]}</td>
                    {#each Object.entries(players) as [teamId, p]}
                        {@const tossupEntry = scoreRow.tossup[teamId]}
                        {#each p as playerId}
                            {#if tossupEntry?.playerId === playerId}
                                <td class="tossup {tossupEntry.scoreType}">
                                    {scoreTypes[tossupEntry.scoreType]}
                                </td>
                            {:else}
                                <td></td>
                            {/if}
                        {/each}
                        {#if scoreRow.bonus?.teamId === teamId}
                            <td class="bonus {scoreRow.bonus?.correct ? "correct" : "incorrect"}">
                                {scoreTypes[scoreRow.bonus?.correct ? "correct" : "incorrect"]}
                            </td>
                        {:else}
                            <td class="bonus"></td>
                        {/if}
                        <td class="running-total">
                            {runningScores[i]?.[teamId] ?? 0}
                        </td>
                    {/each}
                {:else}
                    <td></td>
                    {#each Object.entries(players) as [teamId, p]}
                        {#each p as _}
                            <td></td>
                        {/each}
                        <td class="bonus"></td>
                        <td class="running-total"></td>
                    {/each}
                {/if}
            </tr>
        {:else}
            <tr>
                <td colspan={Object.values(players).reduce((acc, x) => acc + x.length + 2, 0) + 2}>
                    No questions
                </td>
            </tr>
        {/each}
    </table>
    <br />
    <button on:click={exportScores}>Export Scores</button>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    .scoreboard {
        grid-area: scoreboard;
        padding: 2em;
        box-sizing: border-box;
        border-radius: 1em;
        background: $background-1;
        overflow: auto;
    }

    table {
        border-collapse: collapse;
        border: 1px solid $border-color;
        border-radius: 0.5em;
        overflow: hidden;
        min-width: min-content;
    }

    th {
        border: 1px solid $border-color;
        background: $gray-1;
        color: $text-muted;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0.6em;
        min-width: 2em;

        &.player-name {
            writing-mode: vertical-lr;
            transform: rotate(180deg);
            padding: 0.8em 0.4em;
            height: 120px;
            text-align: left;
            width: 2em;
        }

        &.team-name {
            span {
                font-weight: bold;
                color: $text-dark;
            }
            font-size: 1.1rem;
            color: $primary;
            text-transform: none;
            letter-spacing: normal;
        }
    }

    .question-info {
        background: $gray-1;
    }

    tr td {
        border: 1px solid $gray-2;
        color: $text-dark;
        font-size: 0.95rem;

        &:first-child {
            font-weight: 600;
            color: $text-muted;
            background: $gray-1;
            padding: 0 0.8em;
        }
    }

    td {
        text-align: center;
        height: 2.5em;
        min-width: 2.5em;

        &.bonus {
            border-right: 2px solid $gray-2;
        }

        &.correct {
            background: rgba($green, 0.05);
            color: $green-dark;
            font-weight: bold;
        }

        &.incorrect {
            background: rgba($red, 0.05);
            color: $red-dark;
            font-weight: bold;
        }

        &.penalty {
            background: rgba($purple, 0.05);
            color: $purple-dark;
            font-weight: bold;
        }
    }

    button {
        @extend %button;
        font-size: 1rem;
        padding: 0.5em 1em;
    }
</style>