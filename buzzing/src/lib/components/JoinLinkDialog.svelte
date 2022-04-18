<script lang="ts">
    import gameInfoStore from "$lib/stores/gameInfo";
    import { tick } from "svelte";

    let joinLink = `${import.meta.env.VITE_HOST_URL}/join/${$gameInfoStore.gameId}?code=${$gameInfoStore.joinCode}`
    let inputElement: HTMLInputElement
    let copied = false

    async function handleInput() {
        await tick()
        joinLink = `${import.meta.env.VITE_HOST_URL}/join/${$gameInfoStore.gameId}?code=${$gameInfoStore.joinCode}`
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
        padding: 0.3em 0.5em;
        border-top-left-radius: 0.5em;
        border-bottom-left-radius: 0.5em;
    }

    button {
        background: var(--green);
        border: 3px solid black;
        border-left-width: 2px;
        border-radius: 0 0.5em 0.5em 0;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        box-sizing: border-box;
        height: 100%;
        width: 9ch;
        color: white;
    }
</style>