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
                    acc[t] = [s.tossup[t].playerId]
                } else if (!acc[t].includes(s.tossup[t].playerId)) {
                    acc[t].push(s.tossup[t].playerId)
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
    <button on:click={() => dispatch('close')} class="close-button">Close</button>
    <table>
        <colgroup>
            <col span="2" class="question-info" />
        </colgroup>
        <tr>
            <th colspan="2"></th>
            {#each Object.keys(players) as teamId}
                <th colspan={players[teamId].length + 1} style:font-weight="bold">{$teamsStore[teamId].name}</th>
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
            {/each}
            <th></th>
        </tr>
        {#each rowArray as i}
            <tr>
                <td>#{i}</td>
                {#if $gameStore.scores[i]}
                    <td>{categories[$gameStore.scores[i].category]}</td>
                    {#each Object.entries(players) as [teamId, p]}
                        {#each p as playerId}
                            {#if $gameStore.scores[i].tossup[teamId]?.playerId === playerId}
                                <td class="tossup {$gameStore.scores[i].tossup[teamId].scoreType}">
                                    <ScoreboardTableCell
                                        scoreType={$gameStore.scores[i].tossup[teamId].scoreType}
                                        bonus={false}
                                        on:change={(e) => handleTossupChange(
                                            i,
                                            playerId,
                                            teamId,
                                            $gameStore.scores[i].category,
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
                                            $gameStore.scores[i].category,
                                            e.detail
                                        )} />
                                </td>
                            {/if}
                        {/each}
                        {#if $gameStore.scores[i].bonus?.teamId === teamId}
                            <td class="bonus {$gameStore.scores[i].bonus?.correct ? "correct" : "incorrect"}">
                                <ScoreboardTableCell
                                    scoreType={$gameStore.scores[i].bonus?.correct ? "correct" : "incorrect"}
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
                <td>
                    <button class="delete-button" on:click={() => deleteQuestion(i)}>Delete</button>
                </td>
            </tr>
        {:else}
            <tr>
                <td colspan="2"></td>
                <td colspan={Object.values(players).reduce((acc, x) => acc + x.length + 1, 0)}>
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

        &:first-child {
            border-left: 1px solid black;
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

        font-size: 20px;
        padding: 0.6em;
        border-radius: 0.6em;
    }

    .delete-button {
        font-size: inherit;
        padding: 0.2em;
        border: solid black 2px;
        border-radius: 0.2em;
    }
</style>