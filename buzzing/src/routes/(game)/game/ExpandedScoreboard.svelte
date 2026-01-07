<script lang="ts">
    import gameStore from "$lib/stores/game"
    import teamsStore from "$lib/stores/teams"
    import playersStore from "$lib/stores/players"
    import { createEventDispatcher, getContext } from "svelte";
    import type { Category, ScoreType } from "$lib/classes/Game";
    import { convertToCSV } from "$lib/functions/scoreboard";
    import ScoreboardTableCell from "./ScoreboardTableCell.svelte";
    import getSocket from "$lib/socket";
    import Confirm from "$lib/components/Confirm.svelte";
    import type { Writable } from "svelte/store";

    const socket = getSocket()
    const dispatch = createEventDispatcher()

    type ModalStore = Writable<{
        component: ConstructorOfATypedSvelteComponent,
        props: Record<string, unknown>
    } | null>
    const modalStore: ModalStore = getContext('modalStore')

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

    function handleTossupChange(
        number: number,
        playerId: string,
        teamId: string,
        category: Category,
        scoreType: ScoreType | "none"
    ) {
        gameStore.scoreboard.editTossup(
            number,
            playerId,
            teamId,
            category,
            scoreType
        )
        socket.emit("editTossup",
            number,
            playerId,
            teamId,
            category,
            scoreType
        )
    }

    function handleBonusChange(
        number: number,
        teamId: string,
        scoreType: "correct" | "incorrect" | "none"
    ) {
        gameStore.scoreboard.editBonus(number, teamId, scoreType)
        socket.emit("editBonus",
            number,
            teamId,
            scoreType
        )
    }

    function deleteQuestion(number: number) {
        $modalStore = {
            component: Confirm,
            props: {
                title: "Delete Question #" + number,
                message: `Are you sure you want to delete question #${number}?`,
                confirmCallback: () => {
                    gameStore.scoreboard.deleteQuestion(number)
                    socket.emit("deleteQuestion", number)
                    $modalStore = null
                },
                cancelCallback: () => {
                    $modalStore = null
                }
            }
        }
    }

    function clearScores() {
        $modalStore = {
            component: Confirm,
            props: {
                title: "Clear Scores",
                message: "Are you sure you want to clear scores?",
                cancelCallback: () => {
                    $modalStore = null
                },
                confirmCallback: () => {
                    socket.emit('clearScores')
                    $modalStore = null
                }
            }
        }
    }
</script>

<div>
    <table>
        <colgroup>
            <col span="2" class="question-info" />
        </colgroup>
        <tr>
            <th colspan="2"></th>
            {#each Object.keys(players) as teamId}
                {@const teamPlayers = players[teamId]}
                {#if teamPlayers}
                    <th colspan={teamPlayers.length + 2} style:font-weight="bold">{$teamsStore[teamId]?.name || teamId}</th>
                {/if}
            {/each}
            <th></th>
        </tr>
        <tr>
            <th colspan="2"></th>
            {#each Object.values(players) as p}
                {#each p as playerId}
                    <th class="player-name" style:font-weight="normal">{$playersStore[playerId]?.name || "Unknown"}</th>
                {/each}
                <th class="player-name" style:font-weight="bold">Bonus</th>
                <th class="player-name" style:font-weight="bold">Score</th>
            {/each}
            <th></th>
        </tr>
        {#each rowArray as i}
            {@const scoreRow = $gameStore.scores[i]}
            <tr>
                <td class="question-number">#{i}</td>
                {#if scoreRow}
                    <td class="question-category">{categories[scoreRow.category]}</td>
                    {#each Object.entries(players) as [teamId, p]}
                        {@const tossupEntry = scoreRow.tossup[teamId]}
                        {#each p as playerId}
                            {#if tossupEntry?.playerId === playerId}
                                <td class="tossup {tossupEntry.scoreType}">
                                    <ScoreboardTableCell
                                        scoreType={tossupEntry.scoreType}
                                        bonus={false}
                                        on:change={(e) => handleTossupChange(
                                            i,
                                            playerId,
                                            teamId,
                                            scoreRow.category,
                                            e.detail
                                        )} />
                                </td>
                            {:else}
                                <td>
                                    <ScoreboardTableCell
                                        scoreType="none"
                                        bonus={false}
                                        on:change={(e) => handleTossupChange(
                                            i,
                                            playerId,
                                            teamId,
                                            scoreRow.category,
                                            e.detail
                                        )} />
                                </td>
                            {/if}
                        {/each}
                        {#if scoreRow.bonus?.teamId === teamId}
                            <td class="bonus {scoreRow.bonus?.correct ? "correct" : "incorrect"}">
                                <ScoreboardTableCell
                                    scoreType={scoreRow.bonus?.correct ? "correct" : "incorrect"}
                                    bonus={true} 
                                    on:change={(e) => handleBonusChange(i, teamId, e.detail)} />
                            </td>
                        {:else}
                            <td class="bonus">
                                <ScoreboardTableCell
                                    scoreType="none"
                                    bonus={true} 
                                    on:change={(e) => handleBonusChange(i, teamId, e.detail)} />
                            </td>
                        {/if}
                        <td class="scores">
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
                        <td class="scores"></td>
                    {/each}
                {/if}
                <td class="delete-button-cell">
                    <button class="delete-button" on:click={() => deleteQuestion(i)}>Delete</button>
                </td>
            </tr>
        {:else}
            <tr>
                <td colspan="2"></td>
                <td colspan={Object.values(players).reduce((acc, x) => acc + x.length + 2, 0)}>
                    No questions
                </td>
                <td></td>
            </tr>
        {/each}
    </table>
    <br />
    <button on:click={exportScores}>Export Scores</button>
    <button on:click={clearScores}>Clear Scores</button>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    div {
        overflow: auto;
        background: $background-1;
        border-radius: 1em;
        padding: 2em;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        position: relative;
    }

    .close-button {
        position: absolute;
        top: 0.5em;
        right: 0.5em;
        background: $gray-1;
        color: $text-dark;
        box-shadow: none;
        padding: 0.4em 0.8em;
        font-size: 0.9rem;
        
        &:hover {
            filter: brightness(0.95);
        }
    }

    table {
        border-collapse: collapse;
        border: 2px solid $border-color;
        border-radius: 0.5em;
        overflow: hidden;
        margin-top: 1em;
        min-width: min-content;
    }

    th {
        border: 2px solid $border-color;
        background: $gray-1;
        color: $text-muted;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0.6em;
        min-width: 2em;

        &.player-name {
            border-right: 1px solid $border-color;
            border-left: 1px solid $border-color;
            writing-mode: vertical-lr;
            transform: rotate(180deg);
            padding: 0.8em 0.4em;
            height: 120px;
            text-align: left;
            width: 2em;
        }
    }

    .question-info {
        background: $gray-1;
    }

    tr td {
        border: 1px solid $border-color;
        color: $text-dark;
        font-size: 0.95rem;

        &:first-child {
            font-weight: 600;
            color: $text-muted;
            background: $gray-1;
            padding: 0em;
        }
    }

    td {
        text-align: center;
        height: 0em;
        min-width: 2.5em;

        &.scores {
            border-right: 2px solid $gray-2;
        }

        &.delete-button-cell {
            border: 2px solid $border-color;
        }

        &.question-number {
            border: 2px solid $border-color;
        }

        &.question-category {
            border: 2px solid $border-color;
        }
    }

    button {
        @extend %button;

        font-size: 1rem;
        padding: 0.5em 1em;
        margin: 0.25em;
    }

    .delete-button {
        background: transparent;
        color: $red;
        border: 1px solid rgba($red, 0.2);
        box-shadow: none;
        font-size: 0.8rem;
        padding: 0.3em 0.6em;

        &:hover {
            background: rgba($red, 0.1);
            border-color: $red;
            transform: none;
        }
    }
</style>