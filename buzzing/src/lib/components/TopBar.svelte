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
<div id="mobile-top-bar">
    <h1>{joinCode}</h1>
    <slot></slot>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    #top-bar {
        grid-area: top-bar;
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        padding: 0.5em 2em;
        align-items: center;
        position: sticky;
        top: 0;
        left: 0;
        background-color: $background-2;
        z-index: 4;
        box-shadow: $shadow;

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
        font-size: 1.5rem;
        font-weight: 600;
        color: $text-dark;
    }

    .join-code {
        font-size: 1.8rem;
        font-weight: 800;
        cursor: pointer;
        color: $primary;
        display: flex;
        align-items: center;
        gap: 0.2em;
        padding: 0.2em 0.5em;
        border-radius: 0.4em;
        transition: background-color 0.2s;

        &:hover {
            background-color: $background-2;
        }
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

    #mobile-top-bar {
        grid-area: top-bar;
        position: sticky;
        top: 0;
        display: none;
        place-content: center;
        grid-template-columns: 1fr 1fr;
        padding: 0 0.5em;
        width: 100%;
        box-sizing: border-box;
        background: $background-2;
        z-index: 5;
    }

    h1 {
        display: inline-block;
        width: max-content;
    }

    @media (max-width: 500px) {
        #mobile-top-bar {
            display: grid;
        }

        #top-bar {
            display: none;
        }
    }
</style>