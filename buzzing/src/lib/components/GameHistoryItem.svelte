<script lang="ts">
    import { type User } from '$lib/stores/auth';
    import ScoreboardModal from './ScoreboardModal.svelte';
    import { getContext } from 'svelte';
    import { writable, type Writable } from 'svelte/store';

    interface Props {
        game: {
            gameId: string;
            name: string;
            tags: string[];
            memberType: string;
            createdAt: number;
            scores?: any;
            teamNames?: Record<string, string>;
            playerNames?: Record<string, any>;
            pointValues?: {
                tossup: number;
                bonus: number;
                penalty: number;
            };
        };
        expandedGames: Set<string>;
        tagInputs: Record<string, string>;
        currentUser: User | null;
        privateTagsQuery: any;
        toggleGameExpanded: (gameId: string) => void;
        getPrivateTagsForGame: (gameId: string) => string[];
        addPrivateTag: (gameId: string) => Promise<void>;
        removePrivateTag: (gameId: string, tag: string) => Promise<void>;
        addPublicTag: (gameId: string) => Promise<void>;
        removePublicTag: (gameId: string, tag: string) => Promise<void>;
    }

    let { game, expandedGames, tagInputs, currentUser, privateTagsQuery, toggleGameExpanded, getPrivateTagsForGame, addPrivateTag, removePrivateTag, addPublicTag, removePublicTag }: Props = $props();

    type ModalStore = Writable<{
        component: any;
        props: Record<string, unknown>;
    } | null>;
    const modalStore: ModalStore = getContext("modalStore");

    const pointValues = $derived(game.pointValues || { tossup: 4, bonus: 10, penalty: -4 });

    function sumQuestionScores(teamId: string): number {
        if (!game.scores) return 0;
        return Object.values(game.scores).reduce((acc: number, q: any) => {
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

    function openScoreboardModal() {
        if (!modalStore) return;

        $modalStore = {
            component: ScoreboardModal,
            props: {
                scoreboardData: {
                    scores: game.scores || {},
                    teamNames: game.teamNames || {},
                    playerNames: game.playerNames || {},
                    pointValues: pointValues,
                },
            },
        };
    }
</script>

<li class="game-item-wrapper">
    <div class="game-item" onclick={() => toggleGameExpanded(game.gameId)} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleGameExpanded(game.gameId)} role="button" tabindex="0">
        <div class="game-info">
            <span class="game-name">{game.name}</span>
            {#if getPrivateTagsForGame(game.gameId).length > 0}
                <div class="tags-preview">
                    {#each game.tags as tag}
                        <span class="tag public">{tag}</span>
                    {/each}
                    {#each getPrivateTagsForGame(game.gameId) as tag}
                        <span class="tag private">{tag}</span>
                    {/each}
                </div>
            {/if}
        </div>
        <span class="game-meta">
            <span class="game-role">{game.memberType}</span>
            <span class="game-date">{new Date(game.createdAt).toLocaleDateString()}</span>
            <span class="expand-icon">{expandedGames.has(game.gameId) ? '▼' : '▶'}</span>
        </span>
    </div>

    {#if expandedGames.has(game.gameId)}
        <div class="game-details">
            <!-- Private Tags Section -->
            <div class="tag-section">
                <h4>Private Tags (only visible to you)</h4>
                <div class="tags-list">
                    {#each getPrivateTagsForGame(game.gameId) as tag}
                        <span class="tag private">
                            {tag}
                            <button class="tag-remove" onclick={() => removePrivateTag(game.gameId, tag)}>×</button>
                        </span>
                    {/each}
                </div>
                <div class="tag-input-row">
                    <input
                        type="text"
                        placeholder="Add private tag..."
                        bind:value={tagInputs[game.gameId]}
                        onkeydown={(e) => e.key === 'Enter' && addPrivateTag(game.gameId)}
                    />
                    <button onclick={() => addPrivateTag(game.gameId)}>Add</button>
                </div>
            </div>

            <!-- Public Tags Section (moderators only) -->
            {#if game.memberType === 'moderator'}
                <div class="tag-section">
                    <h4>Public Tags (visible to all)</h4>
                    <div class="tags-list">
                        {#each game.tags as tag}
                            <span class="tag public">
                                {tag}
                                <button class="tag-remove" onclick={() => removePublicTag(game.gameId, tag)}>×</button>
                            </span>
                        {/each}
                    </div>
                    <div class="tag-input-row">
                        <input
                            type="text"
                            placeholder="Add public tag..."
                            bind:value={tagInputs[`public-${game.gameId}`]}
                            onkeydown={(e) => e.key === 'Enter' && addPublicTag(game.gameId)}
                        />
                        <button onclick={() => addPublicTag(game.gameId)}>Add</button>
                    </div>
                </div>
            {/if}

            <!-- Team Scores Section -->
            {#if game.teamNames && Object.keys(game.teamNames).length > 0}
                <div class="scores-section">
                    <h4>Final Scores</h4>
                    <div class="team-scores-list">
                        {#each Object.entries(game.teamNames) as [teamId, teamName]}
                            <div class="team-score-item">
                                <span class="team-name">{teamName}</span>
                                <span class="team-score-value">{sumQuestionScores(teamId)}</span>
                            </div>
                        {/each}
                    </div>
                    <button class="view-scoreboard-button" onclick={() => openScoreboardModal()}>View Full Scoreboard</button>
                </div>
            {/if}
        </div>
    {/if}
</li>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    .game-item-wrapper {
        display: flex;
        flex-direction: column;
        background: $background-2;
        border-radius: 0.5rem;
        border: 1px solid $border-color;
        overflow: hidden;
    }

    .game-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        cursor: pointer;
        background: transparent;
        border: none;
        border-radius: 0;

        &:hover {
            background: rgba(0, 0, 0, 0.05);
        }
    }

    .game-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .scores-section {
        margin-bottom: 1rem;

        &:last-child {
            margin-bottom: 0;
        }

        h4 {
            margin: 0 0 0.75rem 0;
            font-size: 0.9rem;
            color: $text;
        }
    }

    .team-scores-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .team-score-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: $background-2;
        border-radius: 0.25rem;
        border: 1px solid $border-color;
    }

    .team-name {
        font-weight: 600;
        color: $text;
    }

    .team-score-value {
        font-size: 1.1rem;
        font-weight: bold;
        color: $primary;
    }

    .game-name {
        font-weight: 600;
        color: $text;
    }

    .game-meta {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .game-role {
        font-size: 0.85rem;
        padding: 0.25rem 0.5rem;
        background: $primary;
        color: white;
        border-radius: 0.25rem;
        text-transform: capitalize;
    }

    .game-date {
        color: $text-muted;
        font-size: 0.9rem;
    }

    .tags-preview {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
    }

    .tag {
        font-size: 0.75rem;
        padding: 0.15rem 0.4rem;
        border-radius: 0.25rem;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;

        &.private {
            background: #e0e7ff;
            color: #3730a3;
        }

        &.public {
            background: #d1fae5;
            color: #065f46;
        }
    }

    .expand-icon {
        font-size: 0.75rem;
        color: $text-muted;
        margin-left: 0.5rem;
    }

    .view-scoreboard-button {
        @extend %button;
        font-size: 0.9rem;
        padding: 0.5rem 1rem;
        margin-top: 0.75rem;
        width: 100%;
    }

    .game-details {
        padding: 1rem;
        border-top: 1px solid $border-color;
        background: rgba(0, 0, 0, 0.02);
    }

    .tag-section {
        margin-bottom: 1rem;

        &:last-child {
            margin-bottom: 0;
        }

        h4 {
            margin: 0 0 0.5rem 0;
            font-size: 0.9rem;
            color: $text;
        }
    }


    .tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .tag-remove {
        background: none;
        border: none;
        padding: 0;
        margin: 0;
        cursor: pointer;
        font-size: 1rem;
        line-height: 1;
        opacity: 0.6;
        min-width: auto;
        min-height: auto;
        box-shadow: none;
        color: $text;

        &:hover {
            transform: translateX(0) translateY(0) !important;
            filter: none;
        }
    }

    .tag-input-row {
        display: flex;
        gap: 0.5rem;

        input {
            flex: 1;
            @extend %text-input;
        }

        button {
            font-size: 1rem;
            padding: 0.5rem 1rem;
            margin: .5rem;
            @extend %button;
        }
    }
</style>
