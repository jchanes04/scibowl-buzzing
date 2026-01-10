<!-- @migration-task Error while migrating Svelte code: `<tr>` cannot be a child of `<table>`. `<table>` only allows these children: `<caption>`, `<colgroup>`, `<tbody>`, `<thead>`, `<tfoot>`, `<style>`, `<script>`, `<template>`. The browser will 'repair' the HTML (by moving, removing, or inserting elements) which breaks Svelte's assumptions about the structure of your components.
https://svelte.dev/e/node_invalid_placement -->
<script lang="ts">
    interface Props {
        scores: NamedScores;
        name: string;
    }

    let { scores, name }: Props = $props();

    import type { Category, ScoreType } from "$lib/classes/Game";
    import {
        convertToCSVNamed,
        type NamedScores,
    } from "$lib/functions/scoreboard";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import EditNames from "./EditNames.svelte";
    import ShortUniqueId from "short-unique-id";
    import { page } from "$app/stores";
    import { goto, invalidateAll } from "$app/navigation";
    import EditGameName from "./EditGameName.svelte";
    import Confirm from "$lib/components/Confirm.svelte";

    let rowNumber = $derived(Math.max(0, ...Object.keys(scores).map(Number)));
    let rowArray = $derived(Array.from({ length: rowNumber }, (_, i) => i + 1));
    let players = $derived(
        Object.values(scores).reduce(
            (acc, s) => {
                for (const t of Object.keys(s.tossup)) {
                    if (!acc[t]) {
                        acc[t] = [s.tossup[t]!.playerName];
                    } else if (!acc[t]!.includes(s.tossup[t]!.playerName)) {
                        acc[t]!.push(s.tossup[t]!.playerName);
                    }
                }
                if (s.bonus?.teamName && !acc[s.bonus?.teamName]) {
                    acc[s.bonus.teamName] = [];
                }
                return acc;
            },
            {} as Record<string, string[]>,
        ),
    );

    let runningScores = $derived(
        (() => {
            // Compute running total for each team row by row.
            let totals: Record<string, number> = {};
            let scoreHistory: Record<number, Record<string, number>> = {};
            Object.entries(scores).forEach(([rowNumStr, row]) => {
                const i = Number(rowNumStr);
                // Copy previous
                totals = { ...totals };
                if (row) {
                    // Tossups
                    for (const [teamName, entry] of Object.entries(
                        row.tossup,
                    )) {
                        if (!totals[teamName]) totals[teamName] = 0;
                        if (entry.scoreType === "correct")
                            totals[teamName] += 4;
                        else if (entry.scoreType === "incorrect")
                            totals[teamName] -= 1;
                        else if (entry.scoreType === "penalty")
                            totals[teamName] -= 4;
                    }
                    // Bonus
                    const bonus = row.bonus;
                    if (bonus && bonus.teamName) {
                        const current = totals[bonus.teamName] ?? 0;
                        totals[bonus.teamName] =
                            current + (bonus.correct ? 10 : 0);
                    }
                }
                scoreHistory[i] = { ...totals };
            });
            return scoreHistory;
        })(),
    );

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
        const csv = await convertToCSVNamed(players, scores);
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

    const pointValues = {
        tossup: 4,
        bonus: 10,
        penalty: -4,
    };

    function sumQuestionScores(teamName: string) {
        return Object.values(scores).reduce((acc, q) => {
            if (q.tossup[teamName]?.scoreType === "correct") {
                acc += pointValues.tossup;
            } else if (q.tossup[teamName]?.scoreType === "penalty") {
                acc += pointValues.penalty;
            }

            if (q.bonus?.teamName === teamName && q.bonus?.correct) {
                acc += pointValues.bonus;
            }
            return acc;
        }, 0);
    }

    function getTeamNames(scores: NamedScores) {
        const teamNames = new Set<string>();
        for (const row of Object.values(scores)) {
            if (row.bonus?.teamName) {
                teamNames.add(row.bonus.teamName);
            }
        }
        return Array.from(teamNames);
    }

    type ModalStore = Writable<{
        component: any;
        props: Record<string, unknown>;
    } | null>;
    const modalStore: ModalStore = getContext("modalStore");

    const generateId = new ShortUniqueId({
        dictionary: "alphanum",
        length: 8,
    });

    function editNames() {
        const teamPlayers = Object.fromEntries(
            Object.entries(players).map(([teamName, playerNames]) => [
                generateId(),
                {
                    teamName,
                    players: Object.fromEntries(
                        playerNames.map((playerName) => [
                            generateId(),
                            playerName,
                        ]),
                    ),
                },
            ]),
        ) as Record<
            string,
            {
                teamName: string;
                players: Record<string, string>;
            }
        >;

        $modalStore = {
            component: EditNames,
            props: {
                teamPlayers,
                confirmCallback: async (
                    teamNames: Record<string, string>,
                    playerNames: Record<string, string>,
                ) => {
                    $modalStore = null;
                    let teamNameChanges: Record<string, string> = {};
                    let playerNameChanges: Record<
                        string,
                        Record<string, string>
                    > = {};

                    for (const [id, name] of Object.entries(teamNames)) {
                        const originalName = teamPlayers[id]?.teamName;
                        if (originalName && name !== originalName) {
                            teamNameChanges[originalName] = name;
                        }
                    }

                    for (const [id, name] of Object.entries(playerNames)) {
                        const teamEntry = Object.values(teamPlayers).find(
                            ({ players }) => Object.keys(players).includes(id),
                        );
                        if (teamEntry) {
                            const { teamName, players } = teamEntry;
                            const originalName = players[id];

                            if (
                                originalName &&
                                Object.hasOwn(playerNameChanges, teamName)
                            ) {
                                playerNameChanges[teamName]![originalName] =
                                    name;
                            } else if (originalName) {
                                playerNameChanges[teamName] = {
                                    [originalName]: name,
                                };
                            }
                        }
                    }

                    await fetch(
                        `/api/tournament/${$page.params.code}/${$page.params.id}`,
                        {
                            method: "PATCH",
                            body: JSON.stringify({
                                teamNameChanges,
                                playerNameChanges,
                            }),
                        },
                    );

                    await invalidateAll();
                },
                cancelCallback: () => {
                    $modalStore = null;
                },
            },
        };
    }

    function editGameName() {
        $modalStore = {
            component: EditGameName,
            props: {
                confirmCallback: async (newName: string) => {
                    await fetch(
                        `/api/tournament/${$page.params.code}/${$page.params.id}`,
                        {
                            method: "PATCH",
                            body: JSON.stringify({
                                newName,
                            }),
                        },
                    );

                    $modalStore = null;
                },
                cancelCallback: () => {
                    $modalStore = null;
                },
                oldName: name,
            },
        };
    }

    function deleteGame() {
        $modalStore = {
            component: Confirm,
            props: {
                title: "Delete Game",
                message: `Are you sure you want to delete ${name}?`,
                confirmCallback: async () => {
                    await fetch(
                        `/api/tournament/${$page.params.code}/${$page.params.id}`,
                        {
                            method: "DELETE",
                        },
                    );

                    $modalStore = null;
                    goto(`/tournament/${$page.params.code}`);
                    invalidateAll();
                },
                cancelCallback: () => {
                    $modalStore = null;
                },
            },
        };
    }
</script>

<div class="scoreboard">
    <table>
        <colgroup>
            <col span="2" class="question-info" />
        </colgroup>
        <thead>
            <tr>
                <th colspan="2"></th>
                {#each Object.keys(players) as teamName}
                    {@const teamPlayers = players[teamName]}
                    {#if teamPlayers}
                        <th colspan={teamPlayers.length + 2} class="team-name"
                            ><span>{teamName}</span>: {sumQuestionScores(
                                teamName,
                            )}</th
                        >
                    {/if}
                {/each}
            </tr>
            {#if rowArray.length}
                <tr>
                    <th colspan="2"></th>
                    {#each Object.values(players) as p}
                        {#each p as playerName}
                            <th class="player-name" style:font-weight="normal"
                                >{playerName}</th
                            >
                        {/each}
                        <th class="player-name" style:font-weight="bold"
                            >Bonus</th
                        >
                        <th class="player-name" style:font-weight="bold"
                            >Score</th
                        >
                    {/each}
                </tr>
            {/if}
        </thead>
        <tbody>
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
                            <td class="running-total">
                                {runningScores[i]?.[teamName] ?? 0}
                            </td>
                        {/each}
                    {:else}
                        <td></td>
                        {#each Object.entries(players) as [teamName, p]}
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
                    <td
                        colspan={Object.values(players).reduce(
                            (acc, x) => acc + x.length + 2,
                            0,
                        ) + 2}
                    >
                        No questions
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
    <br />
    <button onclick={exportScores}>Export Scores</button>
    <button onclick={editNames}>Edit Names</button>
    <button onclick={editGameName}>Rename Game</button>
    <button onclick={deleteGame}>Delete Game</button>
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    .scoreboard {
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
        margin: 0.25em;
    }
</style>
