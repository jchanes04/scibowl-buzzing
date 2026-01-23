<script lang="ts">
    import TournamentTeamCard from "$lib/components/TournamentTeamCard.svelte";
    import ScoreboardModal from "$lib/components/ScoreboardModal.svelte";
    import BracketGame from "./BracketGame.svelte";
    import { modalStore } from "$lib/stores/modal.svelte";
    import { useConvexClient } from "convex-svelte";
    import { api } from "../../../../../../convex/_generated/api";
    import {
        tournamentStore,
        tournamentTeamsStore,
    } from "$lib/stores/tournament.svelte";
    import {
        bracketSizeStore,
        bracketTypeStore,
        bracketStore,
        handleSeedChange,
        getByeSeedFromSource,
        getMatchesByRound,
        getDisplayRounds,
        getFirstRoundPairs,
        getMatchGridPosition,
        getMatchName,
        getGame,
        isMatchLive,
        matchNeedsTieResolution,
        matchEndedInTie,
        getTeamsForMatch,
        buildTeamSlot,
        getDoubleEliminationGridDimensions,
        getDoubleEliminationGridPosition,
        getAllMatchesForGrid,
        getColumnHeaders,
        type BracketMatch,
    } from "$lib/stores/bracket.svelte";
    import {
        isByeMatch,
        getSingleEliminationRoundTitle,
    } from "$lib/functions/bracketGeneration";
    import type { TournamentTeam, MatchBracket } from "../types";

    // Get values from stores
    let tournament = $derived(tournamentStore.value);
    let isOrganizer = $derived(tournamentStore.isOrganizer);
    let teams = $derived(tournamentTeamsStore.value);
    let selectedBracketSize = $derived(bracketSizeStore.value);
    let bracketType = $derived(bracketTypeStore.value);

    // Unified bracket structure
    let totalGridRows = $derived(bracketStore.totalGridRows);
    let displayRoundsArr = $derived(getDisplayRounds("winners"));
    let firstDisplayedRound = $derived(displayRoundsArr.length > 0 ? displayRoundsArr[0]! : 0);
    let grandFinalMatches = $derived(bracketStore.grandFinal);

    // Double elimination grid layout
    let deGridDimensions = $derived(
        getDoubleEliminationGridDimensions(selectedBracketSize),
    );
    let deAllMatches = $derived(getAllMatchesForGrid());
    let deColumnHeaders = $derived(getColumnHeaders());

    const convex = useConvexClient();

    let teamOptions = $derived(
        teams.map((t: TournamentTeam) => ({
            value: t.teamId,
            label: t.name,
        })),
    );

    // Copy moderator link to clipboard (works for both SE and DE)
    function copyModeratorLink(matchIndex: number, bracket: MatchBracket = "winners") {
        const game = getGame(matchIndex, bracket);
        if (!game) return;
        const url = `${window.location.origin}/join/${game.gameId}?code=${game.moderatorJoinCode}`;
        navigator.clipboard.writeText(url);
    }

    // Tie resolver modal state
    let tieModalOpen = $state(false);
    let tieMatchIndex = $state<number | null>(null);
    let tieBracket = $state<MatchBracket | null>(null);

    function openTieResolver(matchIndex: number, bracket?: MatchBracket) {
        tieMatchIndex = matchIndex;
        tieBracket = bracket || null;
        tieModalOpen = true;
    }

    // Open scoreboard modal for a match (works for both SE and DE)
    function openScoreboardModal(matchIndex: number, bracket: MatchBracket = "winners") {
        const game = getGame(matchIndex, bracket);
        if (!game) return;

        const pointValues = game.pointValues || {
            tossup: 4,
            bonus: 10,
            penalty: -4,
        };
        modalStore.showComponent(ScoreboardModal, {
            scoreboardData: {
                scores: game.scores || {},
                teamNames: game.teamNames || {},
                playerNames: game.playerNames || {},
                pointValues: pointValues,
            },
        });
    }

    async function resolveTie(winningTeamId: string) {
        if (tieMatchIndex === null) return;
        await convex.mutation(api.tournaments.resolveTie, {
            tournamentId: tournament.id,
            matchIndex: tieMatchIndex,
            bracket: tieBracket || undefined,
            winningTeamId,
        });
        tieModalOpen = false;
        tieMatchIndex = null;
        tieBracket = null;
    }

    // Get teams for tie resolution (works for both SE and DE)
    function getTieTeams() {
        if (tieMatchIndex === null) return [];
        return getTeamsForMatch(tieMatchIndex, tieBracket || "winners");
    }
</script>

<section class="bracket-section">
    {#if isOrganizer || tournament.bracketConfirmed}
        <h2>
            Bracket {bracketType === "double"
                ? "(Double Elimination)"
                : "(Single Elimination)"}
        </h2>
        {#if selectedBracketSize >= 2}
            {#if bracketType === "double"}
                <!-- DOUBLE ELIMINATION BRACKET - Unified Grid Layout -->
                <div
                    class="de-bracket"
                    style="--de-total-cols: {deGridDimensions.totalCols}; --de-total-rows: {deGridDimensions.totalRows +
                        1}; --de-winners-rows: {deGridDimensions.winnersRows}"
                >
                    <!-- Column Headers -->
                    {#each deColumnHeaders as header, idx}
                        <div
                            class="de-header"
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
                                matchName={getMatchName(
                                    match,
                                    0,
                                    Math.max(0, matchIdxInRound),
                                )}
                                endedInTie={matchEndedInTie(
                                    match.matchIndex,
                                    match.bracket,
                                )}
                                hasGame={!!getGame(
                                    match.matchIndex,
                                    match.bracket,
                                )}
                                isLive={isMatchLive(
                                    match.matchIndex,
                                    match.bracket,
                                )}
                                team1={buildTeamSlot(match, 0)}
                                team2={buildTeamSlot(match, 1)}
                                {teamOptions}
                                {isOrganizer}
                                needsTieResolution={matchNeedsTieResolution(
                                    match.matchIndex,
                                    match.bracket,
                                )}
                                onSeedChange={handleSeedChange}
                                onCopyModLink={() =>
                                    copyModeratorLink(
                                        match.matchIndex,
                                        match.bracket,
                                    )}
                                onResolveTie={() =>
                                    openTieResolver(
                                        match.matchIndex,
                                        match.bracket,
                                    )}
                                onOpenScoreboard={() =>
                                    openScoreboardModal(
                                        match.matchIndex,
                                        match.bracket,
                                    )}
                            />
                        </div>
                    {/each}
                </div>
            {:else}
                <!-- SINGLE ELIMINATION BRACKET -->
                <div class="bracket" style="--total-grid-rows: {totalGridRows}">
                    {#each displayRoundsArr as round, roundIdx}
                        {@const matchesInRound = getMatchesByRound(round)}
                        {@const isFirstDisplayedRound =
                            round === firstDisplayedRound}
                        <div class="bracket-round">
                            <div class="round-title">
                                {getSingleEliminationRoundTitle(roundIdx, displayRoundsArr.length)}
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
                                                {@const byeSeed1 =
                                                    getByeSeedFromSource(
                                                        match.sourceMatch1,
                                                    )}
                                                {@const byeSeed2 =
                                                    getByeSeedFromSource(
                                                        match.sourceMatch2,
                                                    )}
                                                <BracketGame
                                                    matchName={getMatchName(
                                                        match,
                                                        roundIdx,
                                                        pairIdx * 2 + matchIdx,
                                                    )}
                                                    endedInTie={matchEndedInTie(
                                                        match.matchIndex,
                                                    )}
                                                    hasGame={!!getGame(
                                                        match.matchIndex,
                                                    )}
                                                    isLive={isMatchLive(
                                                        match.matchIndex,
                                                    )}
                                                    team1={buildTeamSlot(
                                                        match,
                                                        0,
                                                        byeSeed1,
                                                    )}
                                                    team2={buildTeamSlot(
                                                        match,
                                                        1,
                                                        byeSeed2,
                                                    )}
                                                    {teamOptions}
                                                    {isOrganizer}
                                                    needsTieResolution={matchNeedsTieResolution(
                                                        match.matchIndex,
                                                    )}
                                                    onSeedChange={handleSeedChange}
                                                    onCopyModLink={() =>
                                                        copyModeratorLink(
                                                            match.matchIndex,
                                                        )}
                                                    onResolveTie={() =>
                                                        openTieResolver(
                                                            match.matchIndex,
                                                        )}
                                                    onOpenScoreboard={() =>
                                                        openScoreboardModal(
                                                            match.matchIndex,
                                                        )}
                                                />
                                            {/each}
                                        </div>
                                    {/each}
                                {:else}
                                    <!-- Later rounds: position based on source matches -->
                                    {#each matchesInRound as match, matchIdx}
                                        {@const byeSeed1 = getByeSeedFromSource(
                                            match.sourceMatch1,
                                        )}
                                        {@const byeSeed2 = getByeSeedFromSource(
                                            match.sourceMatch2,
                                        )}
                                        {@const gridPos =
                                            getMatchGridPosition(match)}
                                        <BracketGame
                                            matchName={getMatchName(
                                                match,
                                                roundIdx,
                                                matchIdx,
                                            )}
                                            endedInTie={matchEndedInTie(
                                                match.matchIndex,
                                            )}
                                            hasGame={!!getGame(
                                                match.matchIndex,
                                            )}
                                            isLive={isMatchLive(
                                                match.matchIndex,
                                            )}
                                            team1={buildTeamSlot(
                                                match,
                                                0,
                                                byeSeed1,
                                            )}
                                            team2={buildTeamSlot(
                                                match,
                                                1,
                                                byeSeed2,
                                            )}
                                            {teamOptions}
                                            {isOrganizer}
                                            needsTieResolution={matchNeedsTieResolution(
                                                match.matchIndex,
                                            )}
                                            onSeedChange={handleSeedChange}
                                            onCopyModLink={() =>
                                                copyModeratorLink(
                                                    match.matchIndex,
                                                )}
                                            onResolveTie={() =>
                                                openTieResolver(
                                                    match.matchIndex,
                                                )}
                                            onOpenScoreboard={() =>
                                                openScoreboardModal(
                                                    match.matchIndex,
                                                )}
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

{#if tieModalOpen && tieMatchIndex !== null}
    <div
        class="modal-backdrop"
        role="button"
        tabindex="-1"
        onclick={() => (tieModalOpen = false)}
        onkeydown={(e) => e.key === "Escape" && (tieModalOpen = false)}
    >
        <div
            class="modal"
            role="dialog"
            aria-modal="true"
            tabindex="-1"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
        >
            <h3>Resolve Tie</h3>
            <p>The game ended with a tie. Select the winning team:</p>
            <div class="tie-options">
                {#each getTieTeams() as team}
                    <button
                        class="tie-option"
                        onclick={() => resolveTie(team.teamId)}
                    >
                        {team.name}
                    </button>
                {/each}
            </div>
            <button class="cancel-btn" onclick={() => (tieModalOpen = false)}>
                Cancel
            </button>
        </div>
    </div>
{/if}

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

    .bracket {
        display: flex;
        align-items: stretch;
        justify-content: flex-start;
        gap: 1rem;
        padding: 1rem;
        overflow-x: auto;
    }

    .bracket-round {
        display: flex;
        flex-direction: column;
        min-width: 200px;

        .round-title {
            font-weight: 700;
            color: $primary;
            text-align: center;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid $border-color;
            margin-bottom: 1rem;
        }
    }

    .round-matches {
        display: grid;
        grid-template-rows: repeat(var(--total-grid-rows), minmax(40px, 1fr));
        gap: 0.5rem;
        flex: 1;
    }

    .match-pair {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        gap: 0.5rem;
    }

    // Double Elimination Unified Grid Styles
    .de-bracket {
        display: grid;
        grid-template-columns: repeat(var(--de-total-cols), minmax(180px, 1fr));
        grid-template-rows: auto repeat(
                calc(var(--de-total-rows) - 1),
                minmax(50px, auto)
            );
        gap: 0.5rem 1rem;
        padding: 1rem;
        overflow-x: auto;
        position: relative;
    }

    .de-header {
        font-weight: 700;
        color: $primary;
        text-align: center;
        padding: 0.5rem;
        border-bottom: 2px solid $border-color;
        font-size: 0.95rem;
    }

    .de-bracket-game {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    // Modal Styles
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(2px);
    }

    .modal {
        background: $background-1;
        border-radius: 1rem;
        padding: 2rem;
        max-width: 400px;
        text-align: center;
        box-shadow: $shadow;
        border: 2px solid $border-color;

        h3 {
            margin: 0 0 1rem 0;
            color: $text;
        }

        p {
            color: $text-muted;
            margin-bottom: 1.5rem;
        }
    }

    .tie-options {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

    .tie-option {
        @extend %button;
        background: $primary;
        font-size: 1.1rem;
        padding: 0.75rem;
    }

    .cancel-btn {
        @extend %button;
        background: $gray-2;
        font-size: 0.9rem;
        padding: 0.5rem 1rem;
    }
</style>
