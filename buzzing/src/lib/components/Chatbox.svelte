 <script lang="ts">
    import type { Message } from "$lib/classes/Game"
    import type { Writable } from 'svelte/store';
    import { afterUpdate } from 'svelte'

    export let messages: Writable<Message[]>

    let div: HTMLElement
    
    afterUpdate(() => {
        div.scrollTo(0, div.scrollHeight)
    })
</script>

<div id="chatbox" class="gamediv" bind:this={div}>
    {#each $messages as message}
        <p class={message.type}>{message.text}</p>
    {/each}
</div>

<style lang="scss">
    #chatbox {
        grid-area: chat-box;
        display: flex;
        flex-direction: column;
        overflow-y: scroll;
        height: 100%;
        min-height: 10em;
        max-height: 25em;
        padding: 1em;
        box-sizing: border-box;
        border-radius: 1em;
        background: #EEE;

        &::-webkit-scrollbar {
            width: 5px;
        }

        &::-webkit-scrollbar-button {
            display: none;
        }

        &::-webkit-scrollbar-track {
            background: transparent;
        }

        &::-webkit-scrollbar-thumb {
            background: var(--green);
            width: 5px;
            border-radius: 5px;
        }

        &::-webkit-scrollbar-track-piece:start {
            margin-top: 1.2em;
            background: transparent;
        }

        &::-webkit-scrollbar-track-piece:end {
            margin-bottom: 1.2em;
            background: transparent;
        }
    }

    p {
        margin: 3px 3px 10px 10px;
        margin-block-start: 0em;
        margin-block-end: 0em;
        font-weight: 500;
        font-size: 18px;
    }

    .buzz {
        color: var(--orange);
    }

    .notif {
        color: #000000;
    }

    .warning {
        color: var(--red);
    }

    .success {
        color: var(--green);
    }
</style>