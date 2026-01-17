<script lang="ts">
    import ConnectedIndicator from "../ConnectedIndicator.svelte";
    import HeaderCompact from "$lib/components/HeaderCompact.svelte";

    interface Props {
        children?: import("svelte").Snippet;
    }

    let { children }: Props = $props();
</script>

<div id="page">
    <HeaderCompact />
    {@render children?.()}
    <ConnectedIndicator />
</div>

<style lang="scss">
    #page {
        display: grid;
        grid-template-rows: auto 1fr;
        grid-template-columns: 1fr;
        height: calc(100vh - 1em);
        width: 100%;
        margin-bottom: 1em;

        @media (max-width: 800px) {
            height: none;
            min-height: 130vh;
            margin-bottom: 3em;
        }
    }
</style>
