<script lang="ts">
    import type { PageData } from "./$types"
    import NamedScoreboard from "./NamedScoreboard.svelte";

    export let data: PageData
    let { selectedGame } = data
    $: ({ selectedGame } = data)
</script>

<div>
    {#if selectedGame}
        <h1>{selectedGame.name}</h1>
        <NamedScoreboard scores={selectedGame.scores} name={selectedGame.name} />
    {:else}
        <h1>Game not found</h1>
    {/if}
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    h1 {
        font-size: 44px;
        text-decoration: underline $blue 3px;
        text-underline-offset: 0.2em;
        text-align: center;
    }
</style>