<script lang="ts">
    import type { ScoreType } from "$lib/classes/Game";

    interface Props {
        scoreType: ScoreType | "none";
        bonus: boolean;
        onchange?: (type: ScoreType | "none") => void;
    }

    let { scoreType, bonus, onchange }: Props = $props();

    let clickable = $derived(!!onchange);
    const scoreTypes: (ScoreType | "none")[] = $derived(
        bonus
            ? ["none", "correct", "incorrect"]
            : ["none", "subbed", "correct", "incorrect", "penalty"],
    );

    function handleClick() {
        if (!onchange) return;
        const index = scoreTypes.indexOf(scoreType);
        scoreType = scoreTypes[index + 1] || "none";
        onchange(scoreType);
    }
</script>

<button
    onclick={onchange ? handleClick : undefined}
    class={scoreType}
    class:clickable
>
    {#if scoreType === "correct"}
        C
    {:else if scoreType === "incorrect"}
        I
    {:else if scoreType === "penalty"}
        P
    {:else if scoreType === "subbed"}
        S
    {/if}
</button>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    button {
        border: none;
        background: none;
        padding: 0;
        margin: 0;
        min-width: 1.8ch;
        width: 2.2em;
        height: 2.2em;
        font-weight: 600;
        transition: all 0.1s ease;
        border-radius: 0.2em;

        &:not(.clickable) {
            cursor: default;
        }

        &:not(.clickable):hover {
            filter: none;
        }

        &.clickable {
            cursor: pointer;

            &:hover {
                filter: brightness(0.9);
            }
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

        &.subbed {
            color: light-dark(#666, #aaa);
            background: light-dark(#666, #aaa);
        }
    }
</style>
