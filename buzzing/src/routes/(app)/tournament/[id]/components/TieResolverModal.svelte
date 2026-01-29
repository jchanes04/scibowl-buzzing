<script lang="ts">
    import { modalStore } from "$lib/stores/modal.svelte";
    import { useConvexClient } from "convex-svelte";
    import { api } from "../../../../../../convex/_generated/api";
    import type { MatchBracket } from "../types";

    interface TieTeam {
        teamId: string;
        name: string;
    }

    interface Props {
        tournamentId: string;
        matchIndex: number;
        bracket?: MatchBracket;
        teams: TieTeam[];
    }

    let { tournamentId, matchIndex, bracket, teams }: Props = $props();

    const convex = useConvexClient();

    async function resolveTie(winningTeamId: string) {
        await convex.mutation(api.tournaments.resolveTie, {
            tournamentId,
            matchIndex,
            bracket: bracket || undefined,
            winningTeamId,
        });
        modalStore.hide();
    }

    function closeModal() {
        modalStore.hide();
    }
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && closeModal()} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="modal-backdrop" role="button" tabindex="-1" onclick={closeModal}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
        class="modal"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        onclick={(e) => e.stopPropagation()}
    >
        <h3>Resolve Tie</h3>
        <p>The game ended with a tie. Select the winning team:</p>
        <div class="tie-options">
            {#each teams as team}
                <button
                    class="tie-option"
                    onclick={() => resolveTie(team.teamId)}
                >
                    {team.name}
                </button>
            {/each}
        </div>
        <button class="cancel-btn" onclick={closeModal}> Cancel </button>
    </div>
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

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
