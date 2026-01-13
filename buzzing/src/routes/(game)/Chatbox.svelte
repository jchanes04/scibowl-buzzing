<script lang="ts">
    import chatMessagesStore from '$lib/stores/chatMessages.svelte';
    import { tick } from 'svelte'

    let chatMessagesElement: HTMLElement

    $effect(() => {
        // React to changes in chat messages
        chatMessagesStore.value;
        tick().then(() => {
            if (chatMessagesElement) {
                chatMessagesElement.scrollTo(0, chatMessagesElement.scrollHeight)
            }
        })
    })
</script>

<div class="chatbox">
    <h2>Chat</h2>
    <div class="chat-messages" bind:this={chatMessagesElement}>
        {#each chatMessagesStore.value as message}
            <p class={message.text.startsWith("Penalty") ? "penalty" : message.type}>{message.text}</p>
        {/each}
    </div>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    .chatbox {
        grid-area: chat-box;
        display: grid;
        grid-template-rows: auto 1fr;
        padding: 1.5em;
        box-sizing: border-box;
        border-radius: 1em;
        background: $background-1;
        box-shadow: $shadow;
        border: 3px solid $border-color;
        min-height: 10em;
        max-height: 25em;
    }

    .chat-messages {
        @include vertical-scrollable();

        display: flex;
        flex-direction: column;
        overflow-y: auto;
        gap: 0.5em;
        padding-right: 0.5em;
    }

    h2 {
        font-size: 1.5rem;
        font-weight: 800;
        margin-top: 0;
        margin-bottom: 1.25rem;
        color: $primary;
        border-bottom: 2px solid $gray-2;
        padding-bottom: 0.5rem;
    }

    p {
        margin: 0;
        font-weight: 500;
        font-size: 0.95rem;
        line-height: 1.4;
        padding: 0.5em 0.75em;
        border-radius: 0.5em;
        background: $background-2;
        color: $text;
    }

    .buzz {
        color: $orange-dark;
        background: rgba($orange, 0.1);
        border-left: 3px solid $orange;
    }

    .notif {
        color: $text;
        background: transparent;
        padding: 0.25em 0.75em;
    }

    .warning {
        color: $red-dark;
        background: rgba($red, 0.1);
        border-left: 3px solid $red;
    }

    .penalty {
        color: $purple-dark;
        background: rgba($purple, 0.1);
        border-left: 3px solid $purple;
    }

    .success {
        color: $green-dark;
        background: rgba($green, 0.1);
        border-left: 3px solid $green;
    }
</style>