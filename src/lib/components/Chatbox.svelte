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

<style>
    #chatbox {
        grid-area: chat-box;
        min-height: 200px;
        max-height: 400px;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        border-top-style: solid;
        border-right-style: solid;
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

    .warn {
        color: red;
    }

    .success {
        color: green;
    }
</style>