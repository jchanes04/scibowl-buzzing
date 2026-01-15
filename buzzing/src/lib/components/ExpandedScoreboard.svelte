<script lang="ts">
    import gameStore from "$lib/stores/game.svelte";
    import { teamsStore, playersStore, type ClientTeamData, type ClientPlayer } from "$lib/stores/members.svelte";
    import { scoreboardStore } from "$lib/stores/scoreboard.svelte";
    import { createEventDispatcher, getContext } from "svelte";
    import type { Category, ScoreType } from "$lib/classes/Game";
    import { convertToCSV } from "$lib/functions/scoreboard";
    import ScoreboardTableCell from "./ScoreboardTableCell.svelte";
    import Confirm from "$lib/components/Confirm.svelte";
    import type { Writable } from "svelte/store";
    import { useConvexClient } from "convex-svelte";
    import { api } from "../../../convex/_generated/api";
    import gameIdStore from "$lib/stores/gameId.svelte";

    interface Props {
        isModerator?: boolean;
        showTotalInHeader?: boolean;
    }

    let { isModerator = false, showTotalInHeader = false }: Props = $props();

    const convex = useConvexClient();

    type ModalStore = Writable<{
        component: any;
        props: Record<string, unknown>;
    } | null>;
    const modalStore: ModalStore = getContext("modalStore");

    let rowNumber = $derived(
        scoreboardStore.value
            ? Math.max(0, ...Object.keys(scoreboardStore.value.scores).map(Number))
            : 0
    );
    let rowArray = $derived(Array.from({ length: rowNumber }, (_, i) => i + 1));
    let playersFromScores = $derived(
        scoreboardStore.value
            ? Object.values(scoreboardStore.value.scores).reduce(
                (acc: Record<string, string[]>, s: any) => {
                    for (const t of Object.keys(s.tossup)) {
                        if (!acc[t]) {
                            acc[t] = [s.tossup[t]!.playerId];
                        } else if (!acc[t]!.includes(s.tossup[t]!.playerId)) {
                            acc[t]!.push(s.tossup[t]!.playerId);
                        }
                    }
                    return acc;
                },
                {} as Record<string, string[]>,
            )
            : {}
    );
    let playersFromTeams = $derived(
        Object.entries(teamsStore.value).reduce(
            (acc: Record<string, string[]>, [teamId, team]) => {
                acc[teamId] = Object.keys(team.players);
                return acc;
            },
            {} as Record<string, string[]>,
        ),
    );
    let players = $derived(
        combinePlayersLists(playersFromScores, playersFromTeams),
    );
    let runningScores = $derived(
        scoreboardStore.value
            ? (() => {
                // Compute running total for each team row by row.
                let totals: Record<string, number> = {};
                let scoreHistory: Record<number, Record<string, number>> = {};
                Object.entries(scoreboardStore.value.scores || {}).forEach(([rowNumStr, row]: [string, any]) => {
                    const i = Number(rowNumStr);
                    // Copy previous
                    totals = { ...totals };
                    if (row) {
                        // Tossups
                        for (const [teamId, entry] of Object.entries(row.tossup) as [string, any][]) {
                            if (!totals[teamId]) totals[teamId] = 0;
                            if (entry.scoreType === "correct") totals[teamId] += 4;
                            else if (entry.scoreType === "incorrect")
                                totals[teamId] -= 1;
                            else if (entry.scoreType === "penalty")
                                totals[teamId] -= 4;
                        }
                        // Bonus
                        const bonus = row.bonus;
                        if (bonus && bonus.teamId) {
                            const current = totals[bonus.teamId] ?? 0;
                            totals[bonus.teamId] =
                                current + (bonus.correct ? 10 : 0);
                        }
                    }
                    scoreHistory[i] = { ...totals };
                });
                return scoreHistory;
            })()
            : {}
    );

    function combinePlayersLists(
        list1: Record<string, string[]>,
        list2: Record<string, string[]>,
    ) {
        const list: Record<string, string[]> = {};
        const keys = new Set([...Object.keys(list1), ...Object.keys(list2)]);
        for (const teamId of keys) {
            list[teamId] = [
                ...(list1[teamId] || []),
                ...(list2[teamId] || []).filter(
                    (x) => !(list1[teamId] || []).includes(x),
                ),
            ];
        }
        return list;
    }

    const categories: Record<Category, string> = {
        bio: "B",
        earth: "ES",
        chem: "C",
        physics: "P",
        math: "M",
        energy: "EN",
    };

    const scoreTypes: Record<ScoreType, string> = {
        correct: "C",
        incorrect: "I",
        penalty: "P",
    };

    async function exportScores() {
        const csv = await convertToCSV(
            teamsStore.value,
            playersStore.value,
            players,
            scoreboardStore.value?.scores || {},
        );
        const url = window.URL.createObjectURL(
            new Blob([csv], { type: "plain/text" }),
        );
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "scores.csv";
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
    }

    function handleTossupChange(
        number: number,
        playerId: string,
        teamId: string,
        category: Category,
        scoreType: ScoreType | "none",
    ) {
        if (!isModerator) return;
        const gId = gameIdStore.value;
        if (!gId) return;

        convex.mutation(api.games.editTossup, {
            gameId: gId,
            number,
            playerId,
            teamId,
            category,
            scoreType,
        });
        // Socket emit removed - Convex handles real-time updates
    }

    function handleBonusChange(
        number: number,
        teamId: string,
        scoreType: "correct" | "incorrect" | "none",
    ) {
        if (!isModerator) return;
        const gId = gameIdStore.value;
        if (!gId) return;

        convex.mutation(api.games.editBonus, {
            gameId: gId,
            number,
            teamId,
            scoreType,
        });
        // Socket emit removed - Convex handles real-time updates
    }

    function deleteQuestion(number: number) {
        if (!isModerator) return;
        $modalStore = {
            component: Confirm,
            props: {
                title: "Delete Question #" + number,
                message: `Are you sure you want to delete question #${number}?`,
                confirmCallback: () => {
                    const gId = gameIdStore.value;
                    if (gId) {
                        convex.mutation(api.games.deleteQuestion, {
                            gameId: gId,
                            number,
                        });
                    }
                    $modalStore = null;
                },
                cancelCallback: () => {
                    $modalStore = null;
                },
            },
        };
    }

    function clearScores() {
        if (!isModerator) return;
        $modalStore = {
            component: Confirm,
            props: {
                title: "Clear Scores",
                message: "Are you sure you want to clear scores?",
                cancelCallback: () => {
                    $modalStore = null;
                },
                confirmCallback: () => {
                    const gId = gameIdStore.value;
                    if (gId) {
                        // Clear scores via Convex
                        convex.mutation(api.games.clearScores, { gameId: gId });

                        // Add chat message via Convex
                        convex.mutation(api.chatMessages.add, {
                            gameId: gId,
                            type: "notification",
                            text: "Scores cleared",
                        });
                    }

                    $modalStore = null;
                },
            },
        };
    }

    const pointValues = $derived(
        scoreboardStore.value?.pointValues || { tossup: 4, bonus: 10, penalty: -4 }
    );

    function sumQuestionScores(teamId: string) {
        if (!scoreboardStore.value) return 0;
        return Object.values(scoreboardStore.value.scores).reduce((acc: number, q: any) => {
            if (q.tossup[teamId]?.scoreType === "correct") {
                acc += pointValues.tossup;
            } else if (q.tossup[teamId]?.scoreType === "penalty") {
                acc += pointValues.penalty;
            }

            if (q.bonus?.teamId === teamId && q.bonus?.correct) {
                acc += pointValues.bonus;
            }
            return acc;
        }, 0);
    }
</script>

<div class="expanded-scoreboard">
    <table>
        <colgroup>
            <col span="2" class="question-info" />
        </colgroup>
        <thead>
            <tr>
                <th colspan="2"></th>
                {#each Object.keys(players) as teamId}
                    {@const teamPlayers = players[teamId]}
                    {#if teamPlayers}
                        <th
                            colspan={teamPlayers.length + 2}
                            class:team-name={showTotalInHeader}
                            style:font-weight="bold"
                        >
                            {#if showTotalInHeader}
                                <span>{teamsStore.value[teamId]?.name || teamId}</span
                                >: {sumQuestionScores(teamId)}
                            {:else}
                                {teamsStore.value[teamId]?.name || teamId}
                            {/if}
                        </th>
                    {/if}
                {/each}
                {#if isModerator}
                    <th></th>
                {/if}
            </tr>
            {#if rowArray.length}
                <tr>
                    <th colspan="2"></th>
                    {#each Object.values(players) as p}
                        {#each p as playerId}
                            <th class="player-name" style:font-weight="normal"
                                >{playersStore.value[playerId]?.name || "Unknown"}</th
                            >
                        {/each}
                        <th class="player-name" style:font-weight="bold">Bonus</th>
                        <th class="player-name" style:font-weight="bold">Score</th>
                    {/each}
                    {#if isModerator}
                        <th></th>
                    {/if}
                </tr>
            {/if}
        </thead>
        <tbody>
            {#each rowArray as i}
                {@const scoreRow = scoreboardStore.value?.scores?.[i]}
                <tr>
                    <td class="question-number">#{i}</td>
                    {#if scoreRow}
                        <td class="question-category"
                            >{categories[scoreRow.category as Category]}</td
                        >
                        {#each Object.entries(players) as [teamId, p]}
                            {@const tossupEntry = scoreRow.tossup[teamId]}
                            {#each p as playerId}
                                {#if isModerator}
                                    <td
                                        class="tossup {tossupEntry?.playerId ===
                                        playerId
                                            ? tossupEntry.scoreType
                                            : ''}"
                                    >
                                        <ScoreboardTableCell
                                            scoreType={tossupEntry?.playerId ===
                                            playerId
                                                ? tossupEntry.scoreType
                                                : "none"}
                                            bonus={false}
                                            onchange={(val) =>
                                                handleTossupChange(
                                                    i,
                                                    playerId,
                                                    teamId,
                                                    scoreRow.category,
                                                    val,
                                                )}
                                        />
                                    </td>
                                {:else if tossupEntry?.playerId === playerId}
                                    <td class="tossup {tossupEntry.scoreType}">
                                        {scoreTypes[tossupEntry.scoreType as ScoreType]}
                                    </td>
                                {:else}
                                    <td></td>
                                {/if}
                            {/each}
                            {#if isModerator}
                                <td
                                    class="bonus {scoreRow.bonus?.teamId ===
                                    teamId
                                        ? scoreRow.bonus.correct
                                            ? 'correct'
                                            : 'incorrect'
                                        : ''}"
                                >
                                    <ScoreboardTableCell
                                        scoreType={scoreRow.bonus?.teamId ===
                                        teamId
                                            ? scoreRow.bonus.correct
                                                ? "correct"
                                                : "incorrect"
                                            : "none"}
                                        bonus={true}
                                        onchange={(val) =>
                                            val !== "penalty" &&
                                            handleBonusChange(i, teamId, val)}
                                    />
                                </td>
                            {:else if scoreRow.bonus?.teamId === teamId}
                                <td
                                    class="bonus {scoreRow.bonus?.correct
                                        ? 'correct'
                                        : 'incorrect'}"
                                >
                                    {scoreTypes[
                                        scoreRow.bonus?.correct
                                            ? "correct"
                                            : "incorrect"
                                    ]}
                                </td>
                            {:else}
                                <td class="bonus"></td>
                            {/if}
                            <td class="scores">
                                {runningScores[i]?.[teamId] ?? 0}
                            </td>
                        {/each}
                        {#if isModerator}
                            <td class="delete-button-cell">
                                <button
                                    class="delete-button"
                                    onclick={() => deleteQuestion(i)}>Delete</button
                                >
                            </td>
                        {/if}
                    {:else}
                        <td></td>
                        {#each Object.entries(players) as [teamId, p]}
                            {#each p as _}
                                <td></td>
                            {/each}
                            <td class="bonus"></td>
                            <td class="scores"></td>
                        {/each}
                        {#if isModerator}
                            <td></td>
                        {/if}
                    {/if}
                </tr>
            {:else}
                <tr>
                    <td
                        colspan={Object.values(players).reduce(
                            (acc, x) => acc + x.length + 2,
                            0,
                        ) + (isModerator ? 3 : 2)}
                    >
                        No questions
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
    <div class="actions">
        <button onclick={exportScores}>Export Scores</button>
        {#if isModerator}
            <button onclick={clearScores}>Clear Scores</button>
        {/if}
    </div>
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    .expanded-scoreboard {
        overflow: auto;
        background: $background-1;
        border-radius: 1em;
        padding: 2em;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: 3px solid $border-color;
        position: relative;
    }

    table {
        border-collapse: collapse;
        border: 2px solid $border-color;
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
                color: $text;
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
        border: 1px solid $border-color;
        color: $text;
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
        height: 2.2em;
        min-width: 2.2em;

        &.scores {
            border-right: 2px solid $gray-2;
        }

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

    .actions {
        margin-top: 1em;
        display: flex;
        gap: 0.5em;
    }

    button {
        @extend %button;

        font-size: 1rem;
        padding: 0.5em 1em;
    }

    .delete-button {
        background: transparent;
        color: $red;
        border: 1px solid rgba($red, 0.2);
        box-shadow: none;
        font-size: 0.8rem;
        padding: 0.3em 0.6em;
        margin: .3em;

        &:hover {
            background: rgba($red, 0.1);
            border-color: $red;
            transform: none;
        }
    }
</style>

