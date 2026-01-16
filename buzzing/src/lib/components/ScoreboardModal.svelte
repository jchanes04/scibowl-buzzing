<script lang="ts">
    import ScoreboardTable from "./ScoreboardTable.svelte";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";

    interface Props {
        scoreboardData: any;
    }

    let { scoreboardData }: Props = $props();

    type ModalStore = Writable<{
        component: any;
        props: Record<string, unknown>;
    } | null>;
    const modalStore: ModalStore = getContext("modalStore");

    function closeModal() {
        if (modalStore) {
            $modalStore = null;
        }
    }
</script>

<div
    class="scoreboard-modal"
    onclick={closeModal}
    onkeydown={(e) => e.key === "Escape" && closeModal()}
    role="button"
    tabindex="-1"
>
    <div
        class="modal-content"
        onclick={(e) => e.stopPropagation()}
        role="presentation"
    >
        <ScoreboardTable {scoreboardData} isModerator={false} />
    </div>
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    .scoreboard-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1010; // Increased to be above other elements
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
    }

    .modal-content {
        max-width: 90vw;
        max-height: 90vh;
        overflow: auto;
        background: $background-1;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        border: 2px solid $border-color;
        padding: 1.5rem;

        // Custom scrollbar for better appearance
        &::-webkit-scrollbar {
            width: 7px;
        }

        &::-webkit-scrollbar-button {
            display: none;
        }

        &::-webkit-scrollbar-track {
            background: transparent;
        }

        &::-webkit-scrollbar-thumb {
            background: $primary;
            width: 7px;
            border-radius: 7px;
        }

        &::-webkit-scrollbar-track-piece:start {
            margin-top: 0.2em;
            background: transparent;
        }

        &::-webkit-scrollbar-track-piece:end {
            margin-bottom: 0.2em;
            background: transparent;
        }
    }
</style>
