<script lang="ts">
    import JoinLinkDialog from "./JoinLinkDialog.svelte"

    export let gameName: string
    export let joinCode: string
    export let spectator = false

    let dialogOpen = false
    let clickLock = false
    let joinCodeElement: HTMLElement

    function openDialog() {
        dialogOpen = !dialogOpen
    }

    function handleWindowClick(e: MouseEvent) {
    if (!joinCodeElement.contains(e.target as Node) && !clickLock) {
            dialogOpen = false
        }
    }

    function handleMouseDown(e: MouseEvent) {
        if (joinCodeElement.contains(e.target as Node)) {
            clickLock = true
        }
    }

    function handleMouseUp() {
        clickLock = false
    }
</script>

<svelte:window on:click={handleWindowClick} on:mousedown={handleMouseDown} on:mouseup={handleMouseUp} />

<div id="top-bar">
    <div>
        <h1 class="game-name">{gameName}</h1>
    </div>
    <div style="position: relative;" bind:this={joinCodeElement}>
        <h1 class="join-code" on:click={openDialog}>{joinCode}<span class="icon open" /></h1>
        {#if dialogOpen}
            <div class="join-link-wrapper">
                <JoinLinkDialog {spectator} />
            </div>
        {/if}
    </div>
    <div>
        <slot></slot>
    </div>
</div>

<style lang="scss">
    #top-bar {
        grid-area: top-bar;
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        padding: 0 2em;
        place-content: center;
        position: sticky;
        top: -0.5em;
        left: 0;
        background-color: #d4d9d9;

        * {
            min-width: 1px;
        }
    }

    h1 {
        display: inline-block;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        font-size: 24px;
    }

    .join-code {
        font-size: 32px;
        cursor: pointer;
    }

    .icon {
        display: inline-block;
        height: 1em;
        width: 1em;
        cursor: pointer;
        vertical-align: middle;
        margin-bottom: 0.1em;
    }

    .open {
        background-image: url('/cheveron-down.svg');
    }

    .join-link-wrapper {
        position: absolute;
        left: 50%;
        top: 3.2em;
        transform: translateX(-50%);
    }
</style>