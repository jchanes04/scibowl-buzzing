<script lang="ts">
    import { Pencil } from "lucide-svelte";

    interface Props {
        team: {
            teamId: string;
            name: string;
            players?: string[]; // Server data uses string[]
            registeredBy?: string;
        };
        currentSeed?: number | null;
        maxSeed?: number; // Used to generate dropdown options
        isOrganizer?: boolean;
        currentUserId?: string | null; // Current user's ID for edit permission
        tournamentId?: string; // For edit link
        onSeedChange?: (teamId: string, seed: string) => void;
    }

    let {
        team,
        currentSeed = null,
        maxSeed = 0,
        isOrganizer = false,
        currentUserId = null,
        tournamentId = "",
        onSeedChange,
    }: Props = $props();

    // Check if current user can edit this team
    let canEdit = $derived(
        currentUserId && team.registeredBy === currentUserId && tournamentId,
    );
</script>

<div class="team-card-setup">
    <div class="card-header">
        <span class="team-name">{team.name || "Unknown Team"}</span>
        <div class="header-actions">
            {#if canEdit}
                <a
                    href="/tournament/register/{tournamentId}?edit={team.teamId}"
                    class="edit-btn"
                    title="Edit team"
                >
                    <Pencil size={16} />
                </a>
            {/if}
            {#if isOrganizer && onSeedChange}
                <select
                    class="seed-select-inline"
                    value={currentSeed ?? ""}
                    onchange={(e) => {
                        const val = (e.target as HTMLSelectElement).value;
                        if (team.teamId) onSeedChange(team.teamId, val);
                    }}
                    disabled={!isOrganizer}
                >
                    <option value="">Seed</option>
                    {#each Array.from({ length: maxSeed }, (_, i) => i + 1) as seedNum}
                        <option value={seedNum}>#{seedNum}</option>
                    {/each}
                </select>
            {/if}
        </div>
    </div>
    <div class="card-players">
        {#if team.players && team.players.length > 0}
            <ul>
                {#each team.players as player}
                    <li>{player}</li>
                {/each}
            </ul>
        {:else}
            <span class="no-players">No players</span>
        {/if}
    </div>
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    .team-card-setup {
        background: $background-1;
        border: 3px solid $border-color;
        border-radius: 1rem;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        transition: all 0.2s;
        height: 100%;
        box-sizing: border-box;

        &:hover {
            border-color: $primary;
            transform: translateY(-2px);
            box-shadow: $shadow;
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 0.5rem;
            border-bottom: 2px solid $border-color;
            padding-bottom: 0.75rem;

            .team-name {
                font-weight: 700;
                color: $text;
                font-size: 1.1rem;
                word-break: break-word;
                line-height: 1.3;
            }

            .header-actions {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex-shrink: 0;
            }

            .edit-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 1.75rem;
                height: 1.75rem;
                border-radius: 0.375rem;
                background: $gray-2;
                color: $text;
                transition: all 0.2s;
                text-decoration: none;

                &:hover {
                    background: $primary;
                    color: white;
                    transform: #{"scale(1.1)"};
                }
            }

            .seed-select-inline {
                @extend %text-input;
                padding: 0.2rem 0.4rem;
                font-size: 0.9rem;
                min-width: 60px;
                flex-shrink: 0;
                height: 2.2rem;
            }
        }

        .card-players {
            flex-grow: 1;

            ul {
                list-style: none;
                padding: 0;
                margin: 0;
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
            }

            li {
                font-size: 0.95rem;
                color: $text;
                padding-left: 0.5rem;
                border-left: 2px solid $border-color;
            }

            .no-players {
                font-size: 0.9rem;
                color: $text-muted;
                font-style: italic;
            }
        }
    }
</style>
