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
                    <th colspan={teamPlayers.length + 1} class="team-name"><span>{$teamsStore[teamId]?.name || teamId}</span>: {sumQuestionScores(teamId)}</th>
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
                <td colspan={Object.values(players).reduce((acc, x) => acc + x.length, 0) + Object.values($teamsStore).length + 2}>
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
        padding: 1em;
        box-sizing: border-box;
        border-radius: 1em;
        background: $background-1;
        overflow: auto;
    }

    table {
        border-collapse: collapse;
        border: 1px solid black;
    }

    th {
        border: 1px solid black;
        padding: 0.3em;
        font-weight: normal;

        &.player-name {
            writing-mode: vertical-lr;
            transform: rotate(180deg);
            padding: 0.2em;
        }

        &.team-name {
            span {
                font-weight: bold;
            }
            font-size: 1.3em;
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

        &:first-child {
            border-left: 1px solid black;
        }
    }

    tr:last-child td {
        border-bottom: 1px solid black;
        border-right: 1px solid black;
    }

    td {
        text-align: center;

        &:first-child, &:nth-child(2) {
            padding: 0.1em 0.2em;
        }

        &.bonus {
            border-right: 1px solid black;
        }

        &.correct {
            background: adjust($green, $lightness: 20%);
        }

        &.incorrect {
            background: adjust($red, $lightness: 20%);
        }

        &.penalty {
            background: adjust($red, $lightness: 20%);
        }
    }
</style>