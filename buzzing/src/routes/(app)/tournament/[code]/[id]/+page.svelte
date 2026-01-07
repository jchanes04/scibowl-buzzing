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
        font-size: 2.5rem;
        font-weight: 800;
        margin-bottom: 2rem;
        color: $text-dark;
        text-align: center;
    }
</style>