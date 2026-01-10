<script lang="ts">
    import gameStore from "$lib/stores/game";
    import { env } from "$env/dynamic/public";
    import { fade } from "svelte/transition";

    interface Props {
        gameName: string;
        joinCode: string;
        spectator?: boolean;
        children?: import('svelte').Snippet;
    }

    let {
        gameName,
        joinCode,
        spectator = false,
        children
    }: Props = $props();

    let copied = $state(false);
    let joinLink = $derived(
        spectator
            ? `${env.PUBLIC_HOST_URL}/spectate/${$gameStore.id}`
            : `${env.PUBLIC_HOST_URL}/join/${$gameStore.id}?code=${$gameStore.joinCode}`,
    );

    function copyLink() {
        navigator.clipboard.writeText(joinLink);
        copied = true;
        setTimeout(() => (copied = false), 1000);
    }
</script>

<div id="top-bar">
    <div>
        <h1 class="game-name">{gameName}</h1>
    </div>
    <div style="position: relative;">
        <button class="join-code" onclick={copyLink}>
            {joinCode}
            <div class="icon-wrapper">
                {#if !copied}
                    <span in:fade={{ duration: 150 }} out:fade={{ duration: 150 }} class="icon copy"></span>
                {:else}
                    <span in:fade={{ duration: 150 }} out:fade={{ duration: 150 }} class="icon check"></span>
                {/if}
            </div>
        </button>
    </div>
    <div>
        {#if children}
            {@render children()}
        {/if}
    </div>
</div>
<div id="mobile-top-bar">
    <button class="join-code" onclick={copyLink}>
        {joinCode}
        <div class="icon-wrapper">
            {#if !copied}
                <span in:fade={{ duration: 150 }} out:fade={{ duration: 150 }} class="icon copy"></span>
            {:else}
                <span in:fade={{ duration: 150 }} out:fade={{ duration: 150 }} class="icon check"></span>
            {/if}
        </div>
    </button>
    {#if children}
        {@render children()}
    {/if}
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

    button {
        @extend %button;
    }

    .join-code {
        font-size: 1.8rem;
        font-weight: 800;
        background-color: $background-2;
        color: $primary;
        display: flex;
        align-items: center;

        gap: 0.2em;
        padding: 0.2em 0.5em;

        &:hover:not(:disabled) {
            transform: none;
        }
    }

    .icon-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 1em;
        width: 1em;
        vertical-align: middle;
        margin-bottom: 0.1em;
    }

    .icon {
        position: absolute;
        display: inline-block;
        height: 1em;
        width: 1em;
        cursor: pointer;
    }

    .copy {
        background-color: $primary;
        mask-image: url('/copy.svg');
        mask-size: contain;
        mask-repeat: no-repeat;
        mask-position: center;
        -webkit-mask-image: url('/copy.svg');
        -webkit-mask-size: contain;
        -webkit-mask-repeat: no-repeat;
        -webkit-mask-position: center;
    }

    .check {
        background-color: $green;
        mask-image: url('/check.svg');
        mask-size: contain;
        mask-repeat: no-repeat;
        mask-position: center;
        -webkit-mask-image: url('/check.svg');
        -webkit-mask-size: contain;
        -webkit-mask-repeat: no-repeat;
        -webkit-mask-position: center;
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

        .join-code {
            font-size: 1.2rem;
            padding: 0.1em 0.3em;
        }
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