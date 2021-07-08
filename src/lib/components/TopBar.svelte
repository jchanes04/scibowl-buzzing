<script lang="ts">
    export let gameName: string
</script>

<div id="top-bar">
    <h1>{gameName}</h1>
    <slot></slot>
</div>

<style lang="scss">
    #top-bar {
        grid-area: top-bar;
    }

    h1 {
        display: inline-block;
    }
</style>