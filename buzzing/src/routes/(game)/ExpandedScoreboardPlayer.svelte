<!-- @migration-task Error while migrating Svelte code: `<tr>` is invalid inside `<table>` -->
<script lang="ts">
    import gameStore from "$lib/stores/game";
    import teamsStore from "$lib/stores/teams";
    import playersStore from "$lib/stores/players";
    import { createEventDispatcher } from "svelte";
    import type { Category, ScoreType } from "$lib/classes/Game";
    import { convertToCSV } from "$lib/functions/scoreboard";

    const dispatch = createEventDispatcher();

    $: rowNumber = Math.max(...Object.keys($gameStore.scores).map(Number));
    $: rowArray = Array.from({ length: rowNumber }, (_, i) => i + 1);
    $: playersFromScores = Object.values($gameStore.scores).reduce(
        (acc, s) => {
            for (const t of Object.keys(s.tossup)) {
                if (!acc[t]) {
                    acc[t] = [s.tossup[t]!.playerId];
                } else if (!acc[t]!.includes(s.tossup[t]!.playerId)) {
                    acc[t]!.push(s.tossup[t]!.playerId);
                }
            }
            return acc;
        },
        {} as Record<string, string[]>
    );
    $: playersFromTeams = Object.entries($teamsStore).reduce(
        (acc, [teamId, team]) => {
            acc[teamId] = Object.keys(team.players);
            return acc;
        },
        {} as Record<string, string[]>
    );
    $: players = combinePlayersLists(playersFromScores, playersFromTeams);

    function combinePlayersLists(list1: Record<string, string[]>, list2: Record<string, string[]>) {
        const list: Record<string, string[]> = {};
        const keys = new Set([...Object.keys(list1), ...Object.keys(list2)]);
        for (const teamId of keys) {
            list[teamId] = [
                ...(list1[teamId] || []),
                ...(list2[teamId] || []).filter((x) => !(list1[teamId] || []).includes(x))
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
        energy: "EN"
    };

    const scoreTypes: Record<ScoreType, string> = {
        correct: "C",
        incorrect: "I",
        penalty: "P"
    };

    async function exportScores() {
        const csv = await convertToCSV($teamsStore, $playersStore, players, $gameStore.scores);
        const url = window.URL.createObjectURL(new Blob([csv], { type: "plain/text" }));
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "scores.csv";
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
    }
</script>

<div>
    <button on:click={() => dispatch("close")} class="close-button">Close</button>
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
                        <th colspan={teamPlayers.length + 1} style:font-weight="bold"
                            >{$teamsStore[teamId]?.name || teamId}</th>
                    {/if}
                {/each}
            </tr>
            <tr>
                <th colspan="2"></th>
                {#each Object.values(players) as p}
                    {#each p as playerId}
                        <th class="player-name" style:font-weight="normal"
                            >{$playersStore[playerId]?.name || "Unknown"}</th>
                    {/each}
                    <th class="player-name" style:font-weight="bold">Bonus</th>
                {/each}
            </tr>
        </thead>
        <tbody>
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
                                <td class="bonus {scoreRow.bonus?.correct ? 'correct' : 'incorrect'}">
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
                    <td colspan="2"></td>
                    <td colspan={Object.values(players).reduce((acc, x) => acc + x.length, 0)}> No questions </td>
                    <td></td>
                </tr>
            {/each}
        </tbody>
    </table>
    <br />
    <button on:click={exportScores}>Export Scores</button>
</div>

<style lang="scss">
    /*$$__STYLE_CONTENT__$$*/
</style>
