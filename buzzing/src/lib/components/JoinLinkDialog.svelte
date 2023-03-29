<script lang="ts">
    import gameStore from "$lib/stores/game";
    import { tick } from "svelte";
    import { env } from "$env/dynamic/public"

    export let spectator = false

    let joinLink = spectator
        ? `${env.PUBLIC_HOST_URL}/spectate/${$gameStore.id}`
        : `${env.PUBLIC_HOST_URL}/join/${$gameStore.id}?code=${$gameStore.joinCode}`
    let inputElement: HTMLInputElement
    let copied = false

    async function handleInput() {
        await tick()
        joinLink = spectator
            ? `${env.PUBLIC_HOST_URL}/spectate/${$gameStore.id}`
            : `${env.PUBLIC_HOST_URL}/join/${$gameStore.id}?code=${$gameStore.joinCode}`
        await tick()
        inputElement.setSelectionRange(0, 0)
    }

    function copyLink() {
        inputElement.select()
        inputElement.setSelectionRange(0, joinLink.length)
        navigator.clipboard.writeText(joinLink)
        copied = true
        setTimeout(() => copied = false, 2000)
    }
</script>

<div class="join-link-dialog">
    <input type="text" bind:value={joinLink} on:input={handleInput} bind:this={inputElement}
        spellcheck={false} />
    <button on:click={copyLink}>{copied ? "Copied" : "Copy"}</button>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    .join-link-dialog {
        background-color: #EEE;
        position: relative;
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        padding: 1em;
        border-radius: 1em;
        border: 1px solid black;

        &::after {
            content: '';
            position: absolute;
            top: 0px;
            left: 50%;
            height: 20px;
            width: 20px;
            background-color: #EEE;
            border-top: 1px solid black;
            border-right: 1px solid black;
            transform: translate(-50%, -50%) rotate(-45deg);
            clip-path: polygon(100% 0, 0 0, 100% 100%);
        }
    }

    input {
        border: 1px solid black;
        padding: 0.1em 0.3em;
        border-top-left-radius: 0.5em;
        border-bottom-left-radius: 0.5em;
    }

    button {
        @extend %button;

        border-left-width: 2px;
        border-radius: 0 0.5em 0.5em 0;
        font-size: 16px;
        height: 100%;
        width: 10ch;
        padding: 0.2em 0.3em;
    }
</style>