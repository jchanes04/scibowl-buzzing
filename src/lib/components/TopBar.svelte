<script lang="ts">
    export let gameName: string
    export let joinCode: string
</script>

<div id="top-bar">
    <h1>{gameName}</h1>
    <h1>{joinCode}</h1>
    <slot></slot>
</div>

<style lang="scss">
    #top-bar {
        grid-area: top-bar;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        padding: 0 2em;
    }

    h1 {
        display: inline-block;
    }
</style>