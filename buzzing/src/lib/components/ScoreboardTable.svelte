<script lang="ts">
    import { modalStore } from "$lib/stores/modal.svelte";
    import gameIdStore from "$lib/stores/gameId.svelte";
    import type { Category, ScoreType } from "$lib/classes/Game";
    import ScoreboardTableCell from "./ScoreboardTableCell.svelte";
    import Confirm from "$lib/components/Confirm.svelte";
    import { useConvexClient } from "convex-svelte";
    import { api } from "../../../convex/_generated/api";
    import { calculateTeamScore, derivePlayerNames, deriveTeamNames } from "$lib/functions/scoreboard";
    import type { ScoreboardData, QuestionPairScore } from "$lib/stores/scoreboard.svelte";

    interface Props {
        scoreboardData: ScoreboardData;
        isModerator?: boolean;
    }

    let { scoreboardData, isModerator = false }: Props = $props();

    // Derive playerNames/teamNames from members/teams
    let playerNames = $derived(derivePlayerNames(scoreboardData?.members || {}));
    let teamNames = $derived(deriveTeamNames(scoreboardData?.teams || {}));

    const convex = useConvexClient();

    let rowNumber = $derived(
        scoreboardData
            ? Math.max(0, ...Object.keys(scoreboardData.scores).map(Number))
            : 0,
    );
    let rowArray = $derived(Array.from({ length: rowNumber }, (_, i) => i + 1));
    let playersFromScores = $derived(
        scoreboardData
            ? Object.values(scoreboardData.scores).reduce(
                  (acc: Record<string, string[]>, s: QuestionPairScore) => {
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
            : {},
    );
    let playersFromTeams = $derived(
        (() => {
            const result: Record<string, string[]> = {};
            if (!scoreboardData) return result;
            // Only use teams that exist in teamNames
            for (const [playerId, playerInfo] of Object.entries(
                playerNames || {},
            )) {
                if (
                    playerInfo &&
                    playerInfo.teamId &&
                    teamNames[playerInfo.teamId]
                ) {
                    if (!result[playerInfo.teamId])
                        result[playerInfo.teamId] = [];
                    if (
                        !result[playerInfo.teamId]?.includes(playerId)
                    ) {
                        result[playerInfo.teamId]?.push(playerId);
                    }
                }
            }
            return result;
        })(),
    );
    let players = $derived(
        Object.entries(
            combinePlayersLists(playersFromScores, playersFromTeams),
        ).sort(([idA], [idB]) => {
            const nameA = (
                teamNames?.[idA] || idA
            ).toLowerCase();
            const nameB = (
                teamNames?.[idB] || idB
            ).toLowerCase();
            return nameA.localeCompare(nameB);
        }),
    );
    let runningScores = $derived(
        scoreboardData
            ? (() => {
                  // Compute running total for each team row by row.
                  let totals: Record<string, number> = {};
                  let scoreHistory: Record<number, Record<string, number>> = {};
                  Object.entries(scoreboardData.scores || {}).forEach(
                      ([rowNumStr, row]: [string, QuestionPairScore]) => {
                          const i = Number(rowNumStr);
                          // Copy previous
                          totals = { ...totals };
                          if (row) {
                              // Tossups
                              for (const [teamId, entry] of Object.entries(
                                  row.tossup,
                              ) as [string, TossupEntry][]) {
                                  if (!totals[teamId]) totals[teamId] = 0;
                                  if (entry.scoreType === "correct")
                                      totals[teamId] +=
                                          scoreboardData.pointValues.tossup;
                                  else if (entry.scoreType === "penalty")
                                      totals[teamId] +=
                                          scoreboardData.pointValues.penalty;
                              }
                              // Bonus
                              const bonus = row.bonus;
                              if (bonus && bonus.teamId) {
                                  const current = totals[bonus.teamId] ?? 0;
                                  totals[bonus.teamId] =
                                      current +
                                      (bonus.correct
                                          ? scoreboardData.pointValues.bonus
                                          : 0);
                              }
                          }
                          scoreHistory[i] = { ...totals };
                      },
                  );
                  return scoreHistory;
              })()
            : {},
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
        subbed: "",
    };

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
        modalStore.show({
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
                modalStore.hide();
            },
            cancelCallback: () => {
                modalStore.hide();
            },
        });
    }

    const pointValues = $derived(
        scoreboardData?.pointValues || { tossup: 4, bonus: 10, penalty: -4 },
    );

    function sumQuestionScores(teamId: string) {
        if (!scoreboardData) return 0;
        return calculateTeamScore(teamId, scoreboardData.scores, pointValues);
    }

    // Statistics calculations - only shown when > 10 questions
    const showStats = $derived(rowNumber > 10);

    const categoryList: Category[] = ["bio", "earth", "chem", "physics", "math", "energy"];
    const categoryLabels: Record<Category, string> = {
        bio: "Biology",
        earth: "Earth Science",
        chem: "Chemistry",
        physics: "Physics",
        math: "Math",
        energy: "Energy",
    };

    type TossupEntry = { playerId: string; scoreType: ScoreType };
    type ScoreRow = {
        category: Category;
        tossup: Record<string, TossupEntry>;
        bonus: { teamId: string; correct: boolean } | null
    };

    // Calculate stats per category per player (correct tossups)
    const playerTossupsByCategory = $derived(
        (() => {
            const stats: Record<Category, Record<string, number>> = {
                bio: {}, earth: {}, chem: {}, physics: {}, math: {}, energy: {}
            };
            if (!scoreboardData) return stats;

            for (const [_, row] of Object.entries(scoreboardData.scores || {}) as [string, ScoreRow][]) {
                const cat = row.category;
                for (const [teamId, entry] of Object.entries(row.tossup)) {
                    if (entry.scoreType === "correct") {
                        stats[cat]![entry.playerId] = (stats[cat]![entry.playerId] || 0) + 1;
                    }
                }
            }
            return stats;
        })()
    );

    // Calculate bonuses per category per team
    const teamBonusesByCategory = $derived(
        (() => {
            const stats: Record<Category, Record<string, number>> = {
                bio: {}, earth: {}, chem: {}, physics: {}, math: {}, energy: {}
            };
            if (!scoreboardData) return stats;

            for (const [_, row] of Object.entries(scoreboardData.scores || {}) as [string, ScoreRow][]) {
                const cat = row.category;
                if (row.bonus?.correct) {
                    stats[cat]![row.bonus.teamId] = (stats[cat]![row.bonus.teamId] || 0) + 1;
                }
            }
            return stats;
        })()
    );

    // Calculate total points per category per team (ignoring penalties)
    const teamPointsByCategory = $derived(
        (() => {
            const stats: Record<Category, Record<string, number>> = {
                bio: {}, earth: {}, chem: {}, physics: {}, math: {}, energy: {}
            };
            if (!scoreboardData) return stats;

            for (const [_, row] of Object.entries(scoreboardData.scores || {}) as [string, ScoreRow][]) {
                const cat = row.category;
                // Tossup points (correct only)
                for (const [teamId, entry] of Object.entries(row.tossup)) {
                    if (entry.scoreType === "correct") {
                        if (!stats[cat][teamId]) stats[cat][teamId] = 0;
                        stats[cat][teamId] += pointValues.tossup;
                    }
                }
                // Bonus points
                if (row.bonus?.correct) {
                    if (!stats[cat]![row.bonus.teamId]) stats[cat]![row.bonus.teamId] = 0;
                    stats[cat]![row.bonus.teamId]! += pointValues.bonus;
                }
            }
            return stats;
        })()
    );

    // Calculate penalties and incorrects per player
    const playerPenalties = $derived(
        (() => {
            const stats: Record<string, number> = {};
            if (!scoreboardData) return stats;

            for (const [_, row] of Object.entries(scoreboardData.scores || {}) as [string, ScoreRow][]) {
                for (const [_, entry] of Object.entries(row.tossup)) {
                    if (entry.scoreType === "penalty") {
                        stats[entry.playerId] = (stats[entry.playerId] || 0) + 1;
                    }
                }
            }
            return stats;
        })()
    );

    const playerIncorrects = $derived(
        (() => {
            const stats: Record<string, number> = {};
            if (!scoreboardData) return stats;

            for (const [_, row] of Object.entries(scoreboardData.scores || {}) as [string, ScoreRow][]) {
                for (const [_, entry] of Object.entries(row.tossup)) {
                    if (entry.scoreType === "incorrect") {
                        stats[entry.playerId] = (stats[entry.playerId] || 0) + 1;
                    }
                }
            }
            return stats;
        })()
    );

    // Calculate team totals for penalties/incorrects
    function getTeamPenaltyTotal(teamId: string, teamPlayers: string[]) {
        return teamPlayers.reduce((sum, playerId) => sum + (playerPenalties[playerId] || 0), 0);
    }

    function getTeamIncorrectTotal(teamId: string, teamPlayers: string[]) {
        return teamPlayers.reduce((sum, playerId) => sum + (playerIncorrects[playerId] || 0), 0);
    }

    // Calculate TUH (tossups heard) per player - questions where player is not subbed out
    const playerTUH = $derived(
        (() => {
            const stats: Record<string, number> = {};
            if (!scoreboardData) return stats;

            // TUH = total questions minus questions where player was subbed out
            const totalQuestions = rowNumber;
            const subbedCounts: Record<string, number> = {};

            for (const [_, row] of Object.entries(scoreboardData.scores || {}) as [string, ScoreRow][]) {
                for (const [teamId, entry] of Object.entries(row.tossup)) {
                    if (entry.scoreType === "subbed") {
                        subbedCounts[entry.playerId] = (subbedCounts[entry.playerId] || 0) + 1;
                    }
                }
            }

            for (const [_, teamPlayers] of players) {
                for (const playerId of teamPlayers) {
                    stats[playerId] = totalQuestions - (subbedCounts[playerId] || 0);
                }
            }

            return stats;
        })()
    );

    function getTeamTUHTotal(teamPlayers: string[]) {
        return teamPlayers.reduce((sum, playerId) => sum + (playerTUH[playerId] || 0), 0);
    }
</script>

<table>
    <colgroup>
        <col span="2" class="question-info" />
        {#each players as [_, p]}
            {#each p as _}
                <col style="width: 2.2em;" />
            {/each}
            <col style="width: 2.2em;" />
            <!-- bonus -->
            <col style="width: 2.2em;" />
            <!-- score -->
        {/each}
        {#if isModerator}
            <col /> <!-- delete button -->
        {/if}
    </colgroup>
    <thead>
        <tr>
            <th colspan="2"></th>
            {#each players as [teamId, teamPlayers]}
                {#if teamPlayers}
                    <th
                        colspan={teamPlayers.length + 2}
                        class:team-name={true}
                        style:font-weight="bold"
                    >
                        {teamNames[teamId] || teamId}
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
                {#each players as [_, p]}
                    {#each p as playerId}
                        <th class="player-name" style:font-weight="normal"
                            >{playerNames[playerId]?.name ||
                                "Unknown"}</th
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
            {@const scoreRow = scoreboardData?.scores?.[i]}
            <tr>
                <td class="question-number">#{i}</td>
                {#if scoreRow}
                    <td class="question-category"
                        >{categories[scoreRow.category as Category]}</td
                    >
                    {#each players as [teamId, p]}
                        {@const tossupEntry = scoreRow.tossup[teamId]}
                        {#each p as playerId}
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
                                    onchange={isModerator
                                        ? (val) =>
                                              handleTossupChange(
                                                  i,
                                                  playerId,
                                                  teamId,
                                                  scoreRow.category,
                                                  val,
                                              )
                                        : undefined}
                                />
                            </td>
                        {/each}
                        <td
                            class="bonus {scoreRow.bonus?.teamId === teamId
                                ? scoreRow.bonus.correct
                                    ? 'correct'
                                    : 'incorrect'
                                : ''}"
                        >
                            <ScoreboardTableCell
                                scoreType={scoreRow.bonus?.teamId === teamId
                                    ? scoreRow.bonus.correct
                                        ? "correct"
                                        : "incorrect"
                                    : "none"}
                                bonus={true}
                                onchange={isModerator
                                    ? (val) =>
                                          val !== "penalty" &&
                                          val !== "subbed" &&
                                          handleBonusChange(i, teamId, val)
                                    : undefined}
                            />
                        </td>
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
                    {#each players as [teamId, p]}
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
                    colspan={players.reduce(
                        (acc, [_, x]) => acc + x.length + 2,
                        0,
                    ) + (isModerator ? 3 : 2)}
                >
                    No questions
                </td>
            </tr>
        {/each}
    </tbody>
    {#if showStats}
        <tfoot class="stats-section">
            <!-- Stats Header -->
            <tr class="stats-header-row">
                <th
                    colspan={players.reduce(
                        (acc, [_, x]) => acc + x.length + 2,
                        0,
                    ) + (isModerator ? 3 : 2)}
                    class="stats-header"
                >
                    Score Statistics
                </th>
            </tr>
            <!-- Category rows -->
            {#each categoryList as cat}
                <tr class="stats-row">
                    <td colspan="2" class="stats-label">{categoryLabels[cat]}</td>
                    {#each players as [teamId, teamPlayers]}
                        {#each teamPlayers as playerId}
                            <td class="stats-cell">
                                {playerTossupsByCategory[cat][playerId] || 0}
                            </td>
                        {/each}
                        <td class="stats-cell bonus">
                            {teamBonusesByCategory[cat][teamId] || 0}
                        </td>
                        <td class="stats-cell scores">
                            {teamPointsByCategory[cat][teamId] || 0}
                        </td>
                    {/each}
                    {#if isModerator}
                        <td></td>
                    {/if}
                </tr>
            {/each}
            <!-- Penalties row -->
            <tr class="stats-row">
                <td colspan="2" class="stats-label">Penalties</td>
                {#each players as [teamId, teamPlayers]}
                    {#each teamPlayers as playerId}
                        <td class="stats-cell penalty-cell">
                            {playerPenalties[playerId] || 0}
                        </td>
                    {/each}
                    <td class="stats-cell bonus">
                        {getTeamPenaltyTotal(teamId, teamPlayers)}
                    </td>
                    <td class="stats-cell scores"></td>
                {/each}
                {#if isModerator}
                    <td></td>
                {/if}
            </tr>
            <!-- Incorrects row -->
            <tr class="stats-row">
                <td colspan="2" class="stats-label">Incorrects</td>
                {#each players as [teamId, teamPlayers]}
                    {#each teamPlayers as playerId}
                        <td class="stats-cell incorrect-cell">
                            {playerIncorrects[playerId] || 0}
                        </td>
                    {/each}
                    <td class="stats-cell bonus">
                        {getTeamIncorrectTotal(teamId, teamPlayers)}
                    </td>
                    <td class="stats-cell scores"></td>
                {/each}
                {#if isModerator}
                    <td></td>
                {/if}
            </tr>
            <!-- TUH row -->
            <tr class="stats-row">
                <td colspan="2" class="stats-label">TUH</td>
                {#each players as [teamId, teamPlayers]}
                    {#each teamPlayers as playerId}
                        <td class="stats-cell">
                            {playerTUH[playerId] || 0}
                        </td>
                    {/each}
                    <td class="stats-cell bonus">
                        {getTeamTUHTotal(teamPlayers)}
                    </td>
                    <td class="stats-cell scores"></td>
                {/each}
                {#if isModerator}
                    <td></td>
                {/if}
            </tr>
        </tfoot>
    {/if}
</table>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    table {
        border-collapse: collapse;
        border: 2px solid $border-color;
        background-color: $background-1;
        table-layout: fixed;
        overflow: hidden;
        margin-top: 1em;
    }

    th {
        border: 2px solid $border-color;
        background: $gray-1;
        color: $text-muted;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0.6em;
        width: 2.2em;

        &.player-name {
            writing-mode: vertical-lr;
            transform: rotate(180deg);
            padding: 0.8em 0.4em;
            height: 120px;
            text-align: left;
            width: 0em; // needs this for same layout in chromium and firefox
        }

        &.team-name {
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

    .delete-button {
        background: transparent;
        color: $red;
        border: 2px solid rgba($red, 0.2);
        border-radius: 0.5em;
        box-shadow: none;
        font-size: 0.8rem;
        padding: 0.3em 0.6em;
        margin: 0.3em;

        &:hover {
            background: rgba($red, 0.1);
            border-color: $red;
            transform: none;
            transition: all 0.2s ease-in-out;
        }
    }

    // Stats section styles
    .stats-section {
        border-top: 3px solid $border-color;
    }

    .stats-header-row {
        .stats-header {
            background: $gray-1;
            color: $primary;
            font-size: 1rem;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            padding: 0.8em;
            text-align: center;
            border: 2px solid $border-color;
        }
    }

    .stats-row {
        background: $gray-1;

        .stats-label {
            font-weight: 600;
            color: $text-muted;
            background: $gray-1;
            padding: 0.5em 0.8em;
            text-align: left;
            border: 2px solid $border-color;
            font-size: 0.85rem;
        }

        .stats-cell {
            text-align: center;
            padding: 0.4em;
            font-size: 0.9rem;
            color: $text;
            border: 1px solid $border-color;

            &.bonus {
                border-right: 2px solid $gray-2;
                font-weight: 500;
            }

            &.scores {
                border-right: 2px solid $gray-2;
                font-weight: bold;
                color: $primary;
            }

            &.penalty-cell {
                color: $purple-dark;
            }

            &.incorrect-cell {
                color: $red-dark;
            }
        }
    }
</style>
