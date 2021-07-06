<script lang="ts">
    export let gameName: string
    export let timer

    import Timer from './Timer.svelte'
</script>

<div id="top-bar">
    <h1>{gameName}</h1>
    <Timer bind:timer={timer} />
</div>

<style lang="scss">
    #top-bar {
        grid-area: top-bar;
    }

    h1 {
        display: inline-block;
    }
</style>