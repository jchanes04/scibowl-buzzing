<script lang="ts">
    import type { ScoreType } from "$lib/classes/Game";
    import { createEventDispatcher } from "svelte";

    export let scoreType: ScoreType | "none"
    export let bonus: boolean

    const dispatch = createEventDispatcher()

    function handleClick() {
        if (scoreType === "none") {
            dispatch("change", "correct")
        } else if (scoreType === "correct") {
            dispatch("change", "incorrect")
        } else if (scoreType === "incorrect" && !bonus) {
            dispatch("change", "penalty")
        } else {
            dispatch("change", "none")
        }
    }
</script>

<button on:click={handleClick} class={scoreType}>
    {#if scoreType === "correct"}
        C
    {:else if scoreType === "incorrect"}
        I
    {:else if scoreType === "penalty"}
        P
    {/if}
</button>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    button {
        border: none;
        background: none;
        padding: 0;
        margin: 0;
        cursor: pointer;
        min-width: 1.8ch;
        width: 2em;
        height: 2em;
        font-weight: 600;
        transition: all 0.1s ease;
        border-radius: 0.2em;

        &:hover {
            filter: brightness(0.9);
        }

        &.correct {
            color: $green-dark;
            background: rgba($green, 0.15);
        }

        &.incorrect {
            color: $red-dark;
            background: rgba($red, 0.15);
        }

        &.penalty {
            color: $purple-dark;
            background: rgba($purple, 0.15);
        }
    }
</style>