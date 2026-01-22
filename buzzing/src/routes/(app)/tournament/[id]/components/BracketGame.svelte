<script lang="ts">
    import Select from "svelte-select";
    import { Copy, Check, Scale, Sheet } from "lucide-svelte";
    import { fade } from "svelte/transition";

    interface TeamSlot {
        display: string;
        isWinner: boolean;
        isEditable: boolean;
        seed: number | null;
        currentTeamId: string | null;
        score: number | null;
    }

    interface TeamOption {
        value: string;
        label: string;
    }

    let {
        matchName,
        endedInTie = false,
        hasGame = false,
        isLive = false,
        team1,
        team2,
        teamOptions = [],
        isOrganizer = false,
        needsTieResolution = false,
        onSeedChange,
        onCopyModLink,
        onResolveTie,
        onOpenScoreboard,
        gridRowStyle = "",
    } = $props<{
        matchName: string;
        endedInTie?: boolean;
        hasGame?: boolean;
        isLive?: boolean;
        team1: TeamSlot;
        team2: TeamSlot;
        teamOptions?: TeamOption[];
        isOrganizer?: boolean;
        needsTieResolution?: boolean;
        onSeedChange?: (teamId: string, seedValue: string) => void;
        onCopyModLink?: () => void;
        onResolveTie?: () => void;
        onOpenScoreboard?: () => void;
        gridRowStyle?: string;
    }>();

    let copied = $state(false);

    function handleSeedChange(e: CustomEvent<{ value: string }>, seed: number) {
        onSeedChange?.(e.detail.value, seed.toString());
    }

    function handleSeedClear(currentTeamId: string | null, seed: number) {
        if (currentTeamId) {
            onSeedChange?.(currentTeamId, "");
        }
    }

    function handleCopyModLink(e: MouseEvent) {
        e.stopPropagation();
        if (onCopyModLink) {
            onCopyModLink();
            copied = true;
            setTimeout(() => (copied = false), 1000);
        }
    }

    function handleResolveTie(e: MouseEvent) {
        e.stopPropagation();
        onResolveTie?.();
    }

    function handleOpenScoreboard(e: MouseEvent) {
        e.stopPropagation();
        onOpenScoreboard?.();
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="bracket-game" class:clickable={hasGame} style={gridRowStyle}>
    <div class="header">
        <div class="game-title">
            {matchName}
            {#if isLive}
                <span class="live-badge">live</span>
            {/if}
            {#if endedInTie || needsTieResolution}
                <span class="tie-badge">tie</span>
            {/if}
        </div>
        <div class="game-actions">
            {#if needsTieResolution && isOrganizer}
                <button
                    class="action-btn tie-btn"
                    title="Resolve Tie"
                    onclick={handleResolveTie}
                >
                    <Scale size={14} />
                </button>
            {/if}

            {#if hasGame}
                <button
                    class="action-btn scoreboard-btn"
                    title="Open Scoreboard"
                    onclick={handleOpenScoreboard}
                >
                    <Sheet size={14} />
                </button>
            {/if}

            {#if hasGame && isOrganizer}
                <button
                    class="action-btn copy-btn"
                    title="Copy Moderator Link"
                    onclick={handleCopyModLink}
                >
                    <div class="icon-wrapper">
                        {#if !copied}
                            <span
                                in:fade={{ duration: 150 }}
                                out:fade={{ duration: 150 }}
                                style="position: absolute; height:14px; width:14px;"
                            >
                                <Copy size={14} />
                            </span>
                        {:else}
                            <span
                                in:fade={{ duration: 150 }}
                                out:fade={{ duration: 150 }}
                                style="position: absolute; height:14px; width:14px;"
                            >
                                <Check size={14} />
                            </span>
                        {/if}
                    </div>
                </button>
            {/if}
        </div>
    </div>

    <div class="team-slots">
        <!-- Team 1 Slot -->
        {#if team1.isEditable && team1.seed !== null}
            <div class="bracket-select">
                <Select
                    items={teamOptions}
                    value={teamOptions.find(
                        (o: TeamOption) => o.value === team1.currentTeamId,
                    )}
                    placeholder="Seed {team1.seed}"
                    on:change={(e) => handleSeedChange(e, team1.seed!)}
                    on:clear={() =>
                        handleSeedClear(team1.currentTeamId, team1.seed!)}
                    showChevron={true}
                    clearable={true}
                />
            </div>
        {:else}
            <div class="team-slot" class:winner={team1.isWinner}>
                <span class="team-name">{team1.display}</span>
                {#if team1.score !== null}
                    <span class="team-score">{team1.score}</span>
                {/if}
            </div>
        {/if}

        <!-- Team 2 Slot -->
        {#if team2.isEditable && team2.seed !== null}
            <div class="bracket-select">
                <Select
                    items={teamOptions}
                    value={teamOptions.find(
                        (o: TeamOption) => o.value === team2.currentTeamId,
                    )}
                    placeholder="Seed {team2.seed}"
                    on:change={(e) => handleSeedChange(e, team2.seed!)}
                    on:clear={() =>
                        handleSeedClear(team2.currentTeamId, team2.seed!)}
                    showChevron={true}
                    clearable={true}
                />
            </div>
        {:else}
            <div class="team-slot" class:winner={team2.isWinner}>
                <span class="team-name">{team2.display}</span>
                {#if team2.score !== null}
                    <span class="team-score">{team2.score}</span>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    .bracket-game {
        padding: 0rem;
        align-self: center;
        justify-self: center;
        width: 80%;
        position: relative; // For absolute positioning if needed, though flex is better

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-height: 24px;
        }

        .game-title {
            font-weight: 700;
            color: $text-muted;
            margin-left: 0.5rem;
            font-size: 0.85rem;
        }

        .game-actions {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            margin-right: 0.25rem;
        }

        .team-slots {
            background: $background-2;
            border: 2px solid $border-color;
            display: flex;
            flex-direction: column;
            border-radius: 0.5rem;
            gap: 0rem;
        }

        .team-slot {
            background: $background-2;
            padding: 0.5rem;
            border-radius: 0.5rem;
            font-size: 0.9rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.5rem;

            .team-name {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .team-score {
                font-weight: 700;
                color: $primary;
                flex-shrink: 0;
            }
        }
    }

    .bracket-select {
        min-width: 150px;
        --chevron-height: 0.9rem;
        --font-size: 0.9rem;
        --padding: calc(0.5rem - 4px) 0.5rem;
        --border-radius: 0.5rem;
        --height: 2rem;
        --background: $background-2;
        --border: 3px solid $border-color;
        --border-focused: 3px solid $primary;
        --border-hover: 3px solid $gray-2;
    }

    .tie-badge {
        display: inline-block;
        background: #dc2626;
        color: white;
        font-size: 0.65rem;
        font-weight: 600;
        padding: 0.1rem 0.35rem;
        border-radius: 0.25rem;
        vertical-align: middle;
        text-transform: uppercase;
        letter-spacing: 0.02em;
    }

    .live-badge {
        display: inline-block;
        background: #16a34a;
        color: white;
        font-size: 0.6rem;
        font-weight: 600;
        padding: 0.1rem 0.35rem;
        border-radius: 0.25rem;
        vertical-align: middle;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        margin-bottom: 0.2rem;
    }

    .action-btn {
        background: none;
        border: none;
        padding: 2px;
        cursor: pointer;
        color: $text-muted;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;

        &:hover {
            background: rgba($primary, 0.1);
            color: $primary;
        }

        &.tie-btn {
            color: $orange;
            &:hover {
                background: rgba($orange, 0.1);
            }
        }
    }

    .icon-wrapper {
        position: relative;
        width: 14px;
        height: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
