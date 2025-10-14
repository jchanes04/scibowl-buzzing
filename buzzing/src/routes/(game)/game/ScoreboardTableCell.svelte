<script lang="ts">
    import type { ScoreType } from "$lib/classes/Game";
    import { createEventDispatcher } from "svelte";

    interface Props {
        scoreType: ScoreType | "none";
        bonus: boolean;
    }

    let { scoreType, bonus }: Props = $props();

    const dispatch = createEventDispatcher();

    function handleClick() {
        if (scoreType === "none") {
            dispatch("change", "correct");
        } else if (scoreType === "correct") {
            dispatch("change", "incorrect");
        } else if (scoreType === "incorrect" && !bonus) {
            dispatch("change", "penalty");
        } else {
            dispatch("change", "none");
        }
    }
</script>

<button onclick={handleClick} class={scoreType}>
    {#if scoreType === "correct"}
        C
    {:else if scoreType === "incorrect"}
        I
    {:else if scoreType === "penalty"}
        P
    {/if}
</button>

<style lang="scss">
    button {
        border: none;
        background: none;
        padding: 0;
        cursor: pointer;
        min-width: 1.8ch;
        width: 100%;
        height: 1.8em;
    }
</style>
