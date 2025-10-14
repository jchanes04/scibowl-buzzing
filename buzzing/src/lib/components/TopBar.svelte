<script lang="ts">
    import JoinLinkDialog from "./JoinLinkDialog.svelte";

    interface Props {
        gameName: string;
        joinCode: string;
        spectator?: boolean;
        children?: import("svelte").Snippet;
    }

    let { gameName, joinCode, spectator = false, children }: Props = $props();

    let dialogOpen = $state(false);
    let clickLock = false;
    let joinCodeElement: HTMLElement = $state();

    function openDialog() {
        dialogOpen = !dialogOpen;
    }

    function handleWindowClick(e: MouseEvent) {
        if (!joinCodeElement.contains(e.target as Node) && !clickLock) {
            dialogOpen = false;
        }
    }

    function handleMouseDown(e: MouseEvent) {
        if (joinCodeElement.contains(e.target as Node)) {
            clickLock = true;
        }
    }

    function handleMouseUp() {
        clickLock = false;
    }
</script>

<svelte:window onclick={handleWindowClick} onmousedown={handleMouseDown} onmouseup={handleMouseUp} />

<div id="top-bar">
    <div>
        <h1 class="game-name">{gameName}</h1>
    </div>
    <div style="position: relative;" bind:this={joinCodeElement}>
        <h1 class="join-code" onclick={openDialog}>{joinCode}<span class="icon open"></span></h1>
        {#if dialogOpen}
            <div class="join-link-wrapper">
                <JoinLinkDialog {spectator} />
            </div>
        {/if}
    </div>
    <div>
        {@render children?.()}
    </div>
</div>
<div id="mobile-top-bar">
    <h1>{joinCode}</h1>
    {@render children?.()}
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    #top-bar {
        grid-area: top-bar;
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        padding: 0 2em;
        align-items: center;
        position: sticky;
        top: -0.5em;
        left: 0;
        background-color: $background-2;
        z-index: 5;

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
        background-image: url("/cheveron-down.svg");
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
