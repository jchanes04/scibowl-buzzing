<script lang="ts">
    export let scores: NamedScores
    export let name: string

    import type { Category, ScoreType } from "$lib/classes/Game";
    import { convertToCSVNamed, type NamedScores } from "$lib/functions/scoreboard";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import EditNames from "./EditNames.svelte";
    import ShortUniqueId from "short-unique-id";
    import { page } from "$app/stores";
    import { goto, invalidateAll } from "$app/navigation";
    import EditGameName from "./EditGameName.svelte";
    import Confirm from "$lib/components/Confirm.svelte";

    $: rowNumber = Math.max(...Object.keys(scores).map(Number))
    $: rowArray = Array.from({length: rowNumber}, (_, i) => i + 1)
    $: players = Object.values(scores).reduce((acc, s) => {
            for (const t of Object.keys(s.tossup)) {
                if (!acc[t]) {
                    acc[t] = [s.tossup[t]!.playerName]
                } else if (!acc[t]!.includes(s.tossup[t]!.playerName)) {
                    acc[t]!.push(s.tossup[t]!.playerName)
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

    type ModalStore = Writable<{
        component: ConstructorOfATypedSvelteComponent,
        props: Record<string, unknown>
    } | null>
    const modalStore: ModalStore = getContext('modalStore')

    const generateId = new ShortUniqueId({
        dictionary: "alphanum",
        length: 8
    })

    function editNames() {
        const teamPlayers = Object.fromEntries(
            Object.entries(players).map(([teamName, playerNames]) => [generateId(), {
                teamName,
                players: Object.fromEntries(playerNames.map(playerName => [generateId(), playerName]))
            }])
        ) as Record<string, {
            teamName: string,
            players: Record<string, string>
        }>

        $modalStore = {
            component: EditNames,
            props: {
                teamPlayers,
                confirmCallback: async (teamNames: Record<string, string>, playerNames: Record<string, string>) => {
                    $modalStore = null
                    let teamNameChanges: Record<string, string> = {}
                    let playerNameChanges: Record<string, Record<string, string>> = {}

                    for (const [id, name] of Object.entries(teamNames)) {
                        const originalName = teamPlayers[id]?.teamName
                        if (originalName && name !== originalName) {
                            teamNameChanges[originalName] = name
                        }
                    }

                    for (const [id, name] of Object.entries(playerNames)) {
                        const teamEntry = Object.values(teamPlayers).find(({ players }) => Object.keys(players).includes(id))
                        if (teamEntry) {
                            const { teamName, players } = teamEntry
                            const originalName = players[id]

                            if (originalName && Object.hasOwn(playerNameChanges, teamName)) {
                                playerNameChanges[teamName]![originalName] = name
                            } else if (originalName) {
                                playerNameChanges[teamName] = {
                                    [originalName]: name
                                }
                            }
                        }
                    }

                    await fetch(`/api/tournament/${$page.params.code}/${$page.params.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({
                            teamNameChanges,
                            playerNameChanges
                        })
                    })

                    await invalidateAll()
                },
                cancelCallback: () => {
                    $modalStore = null
                }
            }
        }
    }

    function editGameName() {
        $modalStore = {
            component: EditGameName,
            props: {
                confirmCallback: async (newName: string) => {
                    await fetch(`/api/tournament/${$page.params.code}/${$page.params.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({
                            newName
                        })
                    })

                    $modalStore = null
                },
                cancelCallback: () => {
                    $modalStore = null
                },
                oldName: name
            }
        }
    }

    function deleteGame() {
        $modalStore = {
            component: Confirm,
            props: {
                title: "Delete Game",
                message: `Are you sure you want to delete ${name}?`,
                confirmCallback: async () => {
                    await fetch(`/api/tournament/${$page.params.code}/${$page.params.id}`, {
                        method: "DELETE"
                    })

                    $modalStore = null
                    goto(`/tournament/${$page.params.code}`)
                    invalidateAll()
                },
                cancelCallback: () => {
                    $modalStore = null
                }
            }
        }
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
                {@const teamPlayers = players[teamName]}
                {#if teamPlayers}
                    <th colspan={teamPlayers.length + 1} class="team-name"><span>{teamName}</span>: {sumQuestionScores(teamName)}</th>
                {/if}
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
            {@const scoreRow = scores[i]}
            <tr>
                <td>#{i}</td>
                {#if scoreRow}
                    <td>{categories[scoreRow.category]}</td>
                    {#each Object.entries(players) as [teamName, p]}
                        {@const tossupEntry = scoreRow.tossup[teamName]}
                        {#each p as playerName}
                            {#if tossupEntry?.playerName === playerName}
                                <td class="tossup {tossupEntry.scoreType}">
                                    {scoreTypes[tossupEntry.scoreType]}
                                </td>
                            {:else}
                                <td></td>
                            {/if}
                        {/each}
                        {#if scoreRow.bonus?.teamName === teamName}
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
                <td colspan={Object.values(players).reduce((acc, x) => acc + x.length, 0) + getTeamNames(scores).length + 2}>
                    No questions
                </td>
            </tr>
        {/each}
    </table>
    <br />
    <button on:click={exportScores}>Export Scores</button>
    <button on:click={editNames}>Edit Names</button>
    <button on:click={editGameName}>Rename Game</button>
    <button on:click={deleteGame}>Delete Game</button>
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
        margin: 0.25em;
    }
</style>