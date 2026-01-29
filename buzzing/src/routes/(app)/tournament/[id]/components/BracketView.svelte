<script lang="ts">
    import TournamentTeamCard from "$lib/components/TournamentTeamCard.svelte";
    import BracketGame from "./BracketGame.svelte";
    import {
        tournamentStore,
        tournamentTeamsStore,
    } from "$lib/stores/tournament.svelte";
    import {
        bracketSizeStore,
        bracketTypeStore,
        bracketStore,
        getMatchesByRound,
        getDisplayRounds,
        getFirstRoundPairs,
        getMatchGridPosition,
        getDoubleEliminationGridDimensions,
        getDoubleEliminationGridPosition,
        getAllMatchesForGrid,
        getColumnHeaders,
        calculateRoundRobinStandings,
        getRoundRobinMatchesByRound,
    } from "$lib/stores/bracket.svelte";
    import { getSingleEliminationRoundTitle } from "$lib/functions/bracketGeneration";
    import { getTeamOptions } from "$lib/functions/teamSelection";
    import type { MatchBracket } from "../types";

    // Get values from stores
    let tournament = $derived(tournamentStore.value);
    let isOrganizer = $derived(tournamentStore.isOrganizer);
    let teams = $derived(tournamentTeamsStore.value);
    let selectedBracketSize = $derived(bracketSizeStore.value);
    let bracketType = $derived(bracketTypeStore.value);

    // Unified bracket structure
    let totalGridRows = $derived(bracketStore.totalGridRows);
    let displayRoundsArr = $derived(getDisplayRounds("winners"));
    let firstDisplayedRound = $derived(
        displayRoundsArr.length > 0 ? displayRoundsArr[0]! : 0,
    );
    let grandFinalMatches = $derived(bracketStore.grandFinal);

    // Double elimination grid layout
    let deGridDimensions = $derived(
        getDoubleEliminationGridDimensions(selectedBracketSize),
    );
    let deAllMatches = $derived(getAllMatchesForGrid());
    let deColumnHeaders = $derived(getColumnHeaders());

    // Round robin
    let rrStandingsData = $derived(calculateRoundRobinStandings());
    let rrStandings = $derived(rrStandingsData.standings);
    let rrTeamOrder = $derived(rrStandingsData.teamOrder);
    let rrMatchesByRound = $derived(getRoundRobinMatchesByRound());
    let rrRounds = $derived(
        Array.from(rrMatchesByRound.keys()).sort((a, b) => a - b),
    );

    // Use shared getTeamOptions function for consistency with join page
    let teamOptions = $derived(getTeamOptions(teams));
</script>

<section class="bracket-section">
    {#if isOrganizer || tournament.bracketConfirmed}
        <h2>
            Bracket {bracketType === "double"
                ? "(Double Elimination)"
                : bracketType === "roundrobin"
                  ? "(Round Robin)"
                  : "(Single Elimination)"}
        </h2>
        {#if selectedBracketSize >= 2}
            {#if bracketType === "double"}
                <!-- DOUBLE ELIMINATION BRACKET - Unified Grid Layout -->
                <div
                    class="bracket-container double-elimination"
                    style="--de-total-cols: {deGridDimensions.totalCols}; 
                           --de-total-rows: {deGridDimensions.totalRows + 1}; 
                           --de-winners-rows: {deGridDimensions.winnersRows}"
                >
                    <!-- Column Headers -->
                    {#each deColumnHeaders as header, idx}
                        <div
                            class="round-title"
                            style="grid-column: {idx + 1}; grid-row: 1"
                        >
                            {header}
                        </div>
                    {/each}

                    <!-- Matches -->
                    {#each deAllMatches as match}
                        {@const pos = getDoubleEliminationGridPosition(match)}
                        {@const matchesInRound =
                            match.bracket === "grand_final"
                                ? grandFinalMatches
                                : getMatchesByRound(match.round, match.bracket)}
                        {@const matchIdxInRound = matchesInRound.findIndex(
                            (m) => m.matchIndex === match.matchIndex,
                        )}
                        <div
                            class="de-bracket-game {match.bracket}"
                            style="grid-column: {pos.col}; grid-row: {pos.rowStart +
                                1} / span {pos.rowSpan}"
                        >
                            <BracketGame
                                {match}
                                namingRound={0}
                                namingIndex={Math.max(0, matchIdxInRound)}
                                tournamentId={tournament.id}
                                {isOrganizer}
                                {teamOptions}
                            />
                        </div>
                    {/each}
                </div>
            {:else if bracketType === "roundrobin"}
                <!-- ROUND ROBIN BRACKET -->
                <div class="rr-container">
                    <!-- Standings Matrix Table -->
                    <div class="rr-standings">
                        <h3>Standings</h3>
                        <div class="rr-matrix-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th class="team-col">Team</th>
                                        {#each rrStandings as opponent}
                                            <th>
                                                <span class="h2h-header"
                                                    >{opponent.teamName}</span
                                                >
                                            </th>
                                        {/each}
                                        <th>PPG</th>
                                        <th>Pts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each rrStandings as standing, idx}
                                        <tr>
                                            <td>{idx + 1}</td>
                                            <td class="team-col"
                                                >{standing.teamName}</td
                                            >
                                            {#each rrStandings as opponent}
                                                <td
                                                    class:self-cell={standing.teamId ===
                                                        opponent.teamId}
                                                >
                                                    {#if standing.teamId !== opponent.teamId}
                                                        {@const score =
                                                            standing.headToHead.get(
                                                                opponent.teamId,
                                                            )}
                                                        {#if score !== null && score !== undefined}
                                                            {score}
                                                        {:else}
                                                            <span
                                                                class="not-played"
                                                                >-</span
                                                            >
                                                        {/if}
                                                    {/if}
                                                </td>
                                            {/each}
                                            <td>{standing.ppg}</td>
                                            <td class="points-col"
                                                >{standing.tournamentPoints}</td
                                            >
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Matches Grid by Round -->
                    <div class="bracket-container round-robin">
                        {#each rrRounds as round}
                            {@const matchesInRound =
                                rrMatchesByRound.get(round) || []}
                            <div class="bracket-round">
                                <div class="round-title">RR{round + 1}</div>
                                <div class="round-matches">
                                    {#each matchesInRound as match, matchIdx}
                                        <BracketGame
                                            {match}
                                            namingRound={round}
                                            namingIndex={matchIdx}
                                            tournamentId={tournament.id}
                                            {isOrganizer}
                                            {teamOptions}
                                            bracketOverride="roundrobin"
                                        />
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {:else}
                <!-- SINGLE ELIMINATION BRACKET -->
                <div
                    class="bracket-container single-elimination"
                    style="--total-grid-rows: {totalGridRows}"
                >
                    {#each displayRoundsArr as round, roundIdx}
                        {@const matchesInRound = getMatchesByRound(round)}
                        {@const isFirstDisplayedRound =
                            round === firstDisplayedRound}
                        <div class="bracket-round">
                            <div class="round-title">
                                {getSingleEliminationRoundTitle(
                                    roundIdx,
                                    displayRoundsArr.length,
                                )}
                            </div>
                            <div class="round-matches">
                                {#if isFirstDisplayedRound}
                                    <!-- First displayed round: group matches by pairs in flexboxes -->
                                    {#each Array.from(getFirstRoundPairs().entries()) as [pairIdx, pairMatches]}
                                        {@const gridPos = {
                                            start: pairIdx * 2 + 1,
                                            end: pairIdx * 2 + 3,
                                        }}
                                        <div
                                            class="match-pair"
                                            style="grid-row: {gridPos.start} / {gridPos.end}"
                                        >
                                            {#each pairMatches as match, matchIdx}
                                                <BracketGame
                                                    {match}
                                                    namingRound={roundIdx}
                                                    namingIndex={pairIdx * 2 +
                                                        matchIdx}
                                                    tournamentId={tournament.id}
                                                    {isOrganizer}
                                                    {teamOptions}
                                                />
                                            {/each}
                                        </div>
                                    {/each}
                                {:else}
                                    <!-- Later rounds: position based on source matches -->
                                    {#each matchesInRound as match, matchIdx}
                                        {@const gridPos =
                                            getMatchGridPosition(match)}
                                        <BracketGame
                                            {match}
                                            namingRound={roundIdx}
                                            namingIndex={matchIdx}
                                            tournamentId={tournament.id}
                                            {isOrganizer}
                                            {teamOptions}
                                            gridRowStyle="grid-row: {gridPos.start} / {gridPos.end}"
                                        />
                                    {/each}
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        {:else}
            <p class="no-bracket">
                Select a bracket size of at least 2 to view the bracket.
            </p>
        {/if}
    {:else}
        <!-- Public View: Unconfirmed Bracket -> Show Teams List -->
        <h2>Registered Teams ({teams.length})</h2>
        {#if teams.length === 0}
            <p class="no-teams">No teams registered yet.</p>
        {:else}
            <div class="teams-grid">
                {#each teams as team}
                    <TournamentTeamCard {team} />
                {/each}
            </div>
        {/if}
    {/if}
</section>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    section {
        background: $background-1;
        border: 3px solid $border-color;
        border-radius: 1rem;
        padding: 1.5rem;
        box-shadow: $shadow;

        h2 {
            color: $text;
            font-size: 1.5rem;
            margin: 0 0 1rem 0;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid $border-color;
        }
    }

    .no-teams,
    .no-bracket {
        color: $text-muted;
        font-style: italic;
    }

    .teams-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        width: 100%;
    }

    .bracket-container {
        padding: 1rem;
        gap: 1rem;
        overflow-x: auto;

        &.single-elimination {
            display: flex;
            align-items: stretch;
            justify-content: flex-start;

            .round-matches {
                display: grid;
                grid-template-rows: repeat(
                    var(--total-grid-rows),
                    minmax(40px, 1fr)
                );
                gap: 0.5rem;
                flex: 1;
            }
        }

        &.double-elimination {
            display: grid;
            grid-template-columns: repeat(
                var(--de-total-cols),
                minmax(180px, 1fr)
            );
            grid-template-rows: auto repeat(
                    calc(var(--de-total-rows) - 1),
                    minmax(50px, auto)
                );
            gap: 0.5rem 1rem;
            position: relative;
        }

        &.round-robin {
            display: flex;
            padding: 1rem 0;

            .round-matches {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
        }
    }

    .bracket-round {
        display: flex;
        flex-direction: column;
        min-width: 200px;
    }

    .round-title {
        font-weight: 700;
        color: $primary;
        text-align: center;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid $border-color;
        margin-bottom: 1rem;
    }

    .match-pair {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        gap: 0.5rem;
    }

    .de-bracket-game {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    // Round Robin Styles
    .rr-container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .rr-standings {
        h3 {
            color: $text;
            font-size: 1.2rem;
            margin: 0 0 1rem 0;
        }

        .rr-matrix-wrapper {
            overflow-x: auto;
        }

        table {
            border-collapse: collapse;
            background: $background-2;
            border-radius: 0.5rem;
            overflow: hidden;

            td {
                padding: 0.75rem 1rem;
                text-align: center;
                border-bottom: 1px solid $border-color;
            }

            th {
                padding: 0.75rem 1rem;
                border-bottom: 1px solid $border-color;
                vertical-align: bottom;
                background: $background-1;
                font-weight: 700;
                color: $primary;
            }

            .team-col {
                text-align: left;
                font-weight: 600;
            }

            .h2h-header {
                writing-mode: vertical-rl;
                text-orientation: mixed;
                transform: rotate(180deg);
                white-space: nowrap;
                display: inline-block;
                font-size: 0.85rem;
            }

            .self-cell {
                background: $background-1;
            }

            .not-played {
                color: $text-muted;
            }

            .points-col {
                font-weight: 700;
            }

            tbody tr:last-child td {
                border-bottom: none;
            }

            tbody tr:hover {
                background: rgba($primary, 0.1);
            }
        }
    }
</style>
