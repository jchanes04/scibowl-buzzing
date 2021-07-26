<script lang="ts">
    export let gameName: string
    export let joinCode: string

    let hWidth: number
    let windowWidth: number
    $: displaySmall = gameName.length > 20 || displaySmall ? hWidth * 2.1/1.3 > 0.3 * windowWidth : hWidth > 0.3 * windowWidth
    $: charsHidden = displaySmall ?
        hWidth > 0.3 * windowWidth ?
            charsHidden + 1 :
            charsHidden === 0 || hWidth > 0.28 * windowWidth ?
                charsHidden :
                charsHidden - 1 :
        0

    $: displayText = gameName.slice(0, gameName.length - charsHidden) + (charsHidden === 0 ? '' : '…')
</script>

<svelte:window bind:innerWidth={windowWidth} />

<div id="top-bar">
    <div style="justify-content: start;">
        <h1 class={displaySmall ? "small" : ""} bind:clientWidth={hWidth}>{displayText}</h1>
    </div>
    <div style="justify-content: center;">
        <h1>{joinCode}</h1>
    </div>
    <div style="flex-direction: row-reverse;">
        <slot></slot>
    </div>
</div>

<style lang="scss">
    #top-bar {
        grid-area: top-bar;
        display: flex;
        flex-direction: row;
        padding: 0 2em;

        div {
            width: 33.33%;
            display: flex;
            flex-direction: row;
            align-items: center;
        }
    }

    h1 {
        display: inline-block;
    }

    .small {
        font-size: 1.3em;
    }
</style>