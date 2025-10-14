<script lang="ts">
    import gameStore from "$lib/stores/game";
    import teamsStore from "$lib/stores/teams";
    import playersStore from "$lib/stores/players";
    import type { Category, ScoreType } from "$lib/classes/Game";
    import { convertToCSV } from "$lib/functions/scoreboard";

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

    const pointValues = {
        tossup: 4,
        bonus: 10,
        penalty: -4
    };

    function sumQuestionScores(teamId: string) {
        return Object.values($gameStore.scores).reduce((acc, q) => {
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
    let rowNumber = $derived(Math.max(...Object.keys($gameStore.scores).map(Number)));
    let rowArray = $derived(Array.from({ length: rowNumber }, (_, i) => i + 1));
    let playersFromScores = $derived(
        Object.values($gameStore.scores).reduce(
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
        )
    );
    let playersFromTeams = $derived(
        Object.entries($teamsStore).reduce(
            (acc, [teamId, team]) => {
                acc[teamId] = Object.keys(team.players);
                return acc;
            },
            {} as Record<string, string[]>
        )
    );
    let players = $derived(combinePlayersLists(playersFromScores, playersFromTeams));
</script>

<div class="scoreboard">
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
                        <th colspan={teamPlayers.length + 1} class="team-name"
                            ><span>{$teamsStore[teamId]?.name || teamId}</span>: {sumQuestionScores(teamId)}</th>
                    {/if}
                {/each}
            </tr>
            {#if rowArray.length}
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
            {/if}
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
                    <td
                        colspan={Object.values(players).reduce((acc, x) => acc + x.length, 0) +
                            Object.values($teamsStore).length +
                            2}>
                        No questions
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
    <br />
    <button onclick={exportScores}>Export Scores</button>
</div>

<style lang="scss">
    /*$$__STYLE_CONTENT__$$*/
</style>
