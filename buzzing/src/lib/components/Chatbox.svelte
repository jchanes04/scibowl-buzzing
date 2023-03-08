 <script lang="ts">
    import chatMessagesStore from '$lib/stores/chatMessages';
    import { afterUpdate } from 'svelte'

    let chatMessagesElement: HTMLElement
    afterUpdate(() => {
        chatMessagesElement.scrollTo(0, chatMessagesElement.scrollHeight)
    })
</script>

<div class="chatbox">
    <h2>Chat</h2>
    <div class="chat-messages" bind:this={chatMessagesElement}>
        {#each $chatMessagesStore as message}
            <p class={message.type}>{message.text}</p>
        {/each}
    </div>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    .chatbox {
        grid-area: chat-box;
        display: grid;
        grid-template-rows: auto 1fr;
        padding: 1em;
        box-sizing: border-box;
        border-radius: 1em;
        background: $background-2;
        min-height: 10em;
        max-height: 25em;
    }

    .chat-messages {
        @include vertical-scrollable();

        display: flex;
        flex-direction: column;
        overflow-y: scroll;
    }

    h2 {
        font-size: 26px;
        margin-top: 0.25em;
        margin-left: 0.5em;
    }

    p {
        margin: 3px 3px 10px 10px;
        margin-block-start: 0em;
        margin-block-end: 0em;
        font-weight: 500;
        font-size: 18px;
    }

    .buzz {
        color: $orange;
    }

    .notif {
        color: #000000;
    }

    .warning {
        color: $red;
    }

    .success {
        color: $green;
    }
</style>