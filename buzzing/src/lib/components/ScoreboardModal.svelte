<script lang="ts">
    import ScoreboardTable from './ScoreboardTable.svelte';
    import { getContext } from 'svelte';
    import type { Writable } from 'svelte/store';

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

<div class="scoreboard-modal" onclick={closeModal} onkeydown={(e) => e.key === 'Escape' && closeModal()} role="button" tabindex="-1">
    <ScoreboardTable
        {scoreboardData}
        isModerator={false}
    />
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    .scoreboard-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1001;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
