<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        title: string;
        message: string | Snippet;
        confirmCallback?: () => void;
        cancelCallback?: () => void;
        confirmText?: string;
        cancelText?: string;
        disabled?: boolean;
        size?: "small" | "large";
    }

    let {
        title,
        message,
        confirmCallback,
        cancelCallback,
        confirmText = "Confirm",
        cancelText = "Cancel",
        disabled = false,
        size = "small",
    }: Props = $props();
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && cancelCallback?.()} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    class="modal-background"
    onclick={cancelCallback}
    role="button"
    tabindex="-1"
    aria-label="Close modal"
></div>
<div class="confirm-modal" class:large={size === "large"}>
    <h2>{title}</h2>
    {#if typeof message === "string"}
        <p>{message}</p>
    {:else}
        <div class="custom-message">
            {@render message()}
        </div>
    {/if}
    <div class="actions">
        {#if cancelCallback}
            <button onclick={cancelCallback} {disabled}>{cancelText}</button>
        {/if}
        {#if confirmCallback}
            <button onclick={confirmCallback} {disabled}>{confirmText}</button>
        {/if}
    </div>
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    .modal-background {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 99;
    }

    .confirm-modal {
        background: $background-1;
        border-radius: 1.5rem;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 2.5rem;
        box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
        border: 1px solid $border-color;
        width: 70%;
        max-width: 450px;
        z-index: 100;
        text-align: center;

        &.large {
            max-width: 900px;
            max-height: 90vh;
            overflow: auto;
        }
    }

    h2 {
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
        font-weight: 800;
        color: $text;
    }

    p {
        margin: 0 0 2rem 0;
        font-size: 1.1rem;
        color: $gray-2;
        line-height: 1.5;
    }

    .custom-message {
        margin-bottom: 2rem;
        text-align: left;
    }

    :global(.modal-message-text) {
        margin-bottom: 1rem;
        font-size: 1.1rem;
        color: $gray-2;
        text-align: center;
    }

    :global(.modal-input) {
        @extend %text-input;
        width: calc(100% - 2rem);
        font-size: 1.1rem;
    }

    .actions {
        display: flex;
        justify-content: center;
        gap: 1rem;
    }

    button {
        @extend %button;
        font-size: 1rem;
        padding: 0.75rem 1.5rem;
        margin: 0;

        &:first-of-type:not(:last-of-type) {
            background: $gray-1;
            color: $gray-2;
            box-shadow: none;

            &:hover {
                filter: brightness(0.95);
            }
        }
    }
</style>
