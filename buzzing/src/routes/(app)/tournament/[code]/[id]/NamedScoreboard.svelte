<script lang="ts">
    export let scores: NamedScores
    import type { Category, ScoreType } from "$lib/classes/Game";
    import { convertToCSVNamed, type NamedScores } from "$lib/functions/scoreboard";

    $: rowNumber = Math.max(...Object.keys(scores).map(Number))
    $: rowArray = Array.from({length: rowNumber}, (_, i) => i + 1)
    $: players = Object.values(scores).reduce((acc, s) => {
            for (const t of Object.keys(s.tossup)) {
                if (!acc[t]) {
                    acc[t] = [s.tossup[t].playerName]
                } else if (!acc[t].includes(s.tossup[t].playerName)) {
                    acc[t].push(s.tossup[t].playerName)
                }
            }
            if (s.bonus?.teamName && !acc[s.bonus?.teamName]) {
                acc[s.bonus.teamName] = []
            }
            return acc
        }, {} as Record<string, string[]>)

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
        const csv = await convertToCSVNamed(players, scores)
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

    function sumQuestionScores(teamName: string) {
        return Object.values(scores).reduce((acc, q) => {
            if (q.tossup[teamName]?.scoreType === "correct") {
                acc += pointValues.tossup 
            } else if (q.tossup[teamName]?.scoreType === "penalty") {
                acc += pointValues.penalty
            }

            if (q.bonus?.teamName === teamName && q.bonus?.correct) {
                acc += pointValues.bonus
            }
            return acc
        }, 0)
    }

    function getTeamNames(scores: NamedScores) {
        const teamNames = new Set<string>()
        for (const row of Object.values(scores)) {
            if (row.bonus?.teamName) {
                teamNames.add(row.bonus.teamName)
            }
        }
        return Array.from(teamNames)
    }
</script>

<div class="scoreboard">
    <table>
        <colgroup>
            <col span="2" class="question-info" />
        </colgroup>
        <tr>
            <th colspan="2"></th>
            {#each Object.keys(players) as teamName}
                <th colspan={players[teamName].length + 1} class="team-name"><span>{teamName}</span>: {sumQuestionScores(teamName)}</th>
            {/each}
        </tr>
        {#if rowArray.length}
            <tr>
                <th colspan="2"></th>
                {#each Object.values(players) as p}
                    {#each p as playerName}
                        <th class="player-name" style:font-weight="normal">{playerName}</th>
                    {/each}
                    <th class="player-name" style:font-weight="bold">Bonus</th>
                {/each}
            </tr>
        {/if}
        {#each rowArray as i}
            <tr>
                <td>#{i}</td>
                {#if scores[i]}
                    <td>{categories[scores[i].category]}</td>
                    {#each Object.entries(players) as [teamName, p]}
                        {#each p as playerName}
                            {#if scores[i].tossup[teamName]?.playerName === playerName}
                                <td class="tossup {scores[i].tossup[teamName].scoreType}">
                                    {scoreTypes[scores[i].tossup[teamName].scoreType]}
                                </td>
                            {:else}
                                <td></td>
                            {/if}
                        {/each}
                        {#if scores[i].bonus?.teamName === teamName}
                            <td class="bonus {scores[i].bonus?.correct ? "correct" : "incorrect"}">
                                {scoreTypes[scores[i].bonus?.correct ? "correct" : "incorrect"]}
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
                <td colspan={Object.values(players).reduce((acc, x) => acc + x.length, 0) + getTeamNames(scores).length + 2}>
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

        &:last-child {
            border-right: 1px solid black;
        }
    }

    tr:last-child td {
        border-bottom: 1px solid black;
    }

    td {
        text-align: center;

        &:first-child, &:nth-child(2) {
            padding: 0.1em 0.2em;
        }

        &.bonus {
            border-right: 1px solid black;
        }

        &:has(+ .bonus) {
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

    button {
        @extend %button;

        font-size: 22px;
    }
</style>