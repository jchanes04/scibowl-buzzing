<script lang="ts">
    import { slide } from "svelte/transition";
    import ExpandChevron from "./ExpandChevron.svelte";
    import type { Snippet } from "svelte";

    interface Props {
        title: string;
        children: Snippet;
        open?: boolean;
    }

    let { title, children, open = $bindable(false) }: Props = $props();
</script>

<div class="collapsible-section" class:open>
    <button type="button" class="section-header" onclick={() => (open = !open)}>
        <h2>{title}</h2>
        <ExpandChevron expanded={open} size="1.25em" />
    </button>

    {#if open}
        <div transition:slide={{ duration: 400 }} style="overflow: hidden;">
            <div class="section-content" style="display: flow-root;">
                {@render children()}
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    .collapsible-section {
        margin-top: 1.5rem;
        background: $background-2;
        border-radius: 1rem;
        border: 3px solid $border-color;
        overflow: hidden;
        transition: all 0.3s ease;

        &.open {
            border-color: $primary;
            background: $background-1;
            box-shadow: $shadow;
        }
    }

    .section-header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
            background: rgba(0, 0, 0, 0.05);
        }

        h2 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 700;
            color: $primary;
        }
    }

    .section-content {
        padding: 0 1rem 1rem 1rem;
    }
</style>
