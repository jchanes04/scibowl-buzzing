 <script lang="ts">
    import type { Message } from "$lib/classes/Game"
    import type { Writable } from 'svelte/store';

    export let messages: Writable<Message[]>
</script>

<div id="chatbox" class="gamediv">
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
        border-top: solid 2px;
        border-right: solid 2px;
        border-left: solid 1px;
        border-bottom: solid 1px;
        padding: 1em;
        box-sizing: border-box;

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
            margin-top: 0.2em;
            background: transparent;
        }

        &::-webkit-scrollbar-track-piece:end {
            margin-bottom: 0.2em;
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
        color: #f09231;
    }

    .notif {
        color: #000000;
    }

    .warning {
        color: red;
    }

    .success {
        color: green;
    }
</style>