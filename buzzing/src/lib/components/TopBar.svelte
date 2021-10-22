<script lang="ts">
    export let gameName: string
    export let joinCode: string

    let hWidth: number
    let windowWidth: number
    $: displaySmall = gameName.length > 20 || displaySmall ? hWidth * 2.1/1.3 > 0.3 * windowWidth : hWidth > 0.29 * windowWidth
    $: displayText = gameName
</script>

<svelte:window bind:innerWidth={windowWidth} />

<div id="top-bar">
    <div>
        <h1 class:small={displaySmall} bind:clientWidth={hWidth}>{displayText}</h1>
    </div>
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

        * {
            display: grid;
            place-content: center;
        }
    }

    h1 {
        display: inline-block;
        width: max-content;
    }

    .small {
        font-size: 1.3em;
    }
</style>