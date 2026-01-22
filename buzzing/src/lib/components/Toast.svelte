<script lang="ts">
    import { toastStore } from "$lib/stores/toast.svelte";
    import { fly, fade } from "svelte/transition";
    import { flip } from "svelte/animate";

    let toasts = $derived(toastStore.toasts);
</script>

<div class="toast-container">
    {#each toasts as toast (toast.id)}
        <div
            class="toast {toast.type}"
            in:fly={{ y: 20, duration: 300 }}
            out:fade={{ duration: 200 }}
            animate:flip
        >
            <div class="message">{toast.message}</div>
            <button
                class="close-btn"
                onclick={() => toastStore.remove(toast.id)}
            >
                ×
            </button>
        </div>
    {/each}
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    .toast-container {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        z-index: 9999;
        pointer-events: none; /* Allow clicks to pass through container */
    }

    .toast {
        pointer-events: auto; /* Re-enable clicks on toasts */
        min-width: 300px;
        max-width: 400px;
        padding: 1rem;
        border-radius: 0.5rem;
        background: $background-2;
        box-shadow: $shadow;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        border-left: 5px solid transparent;
        color: $text;
        font-weight: 500;

        &.success {
            border-left-color: $green;
            background: color-mix(in srgb, $green 10%, $background-2);
        }

        &.error {
            border-left-color: $red;
            background: color-mix(in srgb, $red 10%, $background-2);
        }

        &.info {
            border-left-color: $blue;
            background: color-mix(in srgb, $blue 10%, $background-2);
        }

        &.warning {
            border-left-color: $orange;
            background: color-mix(in srgb, $orange 10%, $background-2);
        }

        .message {
            flex: 1;
            word-break: break-word;
        }

        .close-btn {
            background: transparent;
            border: none;
            color: $text-muted;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            line-height: 1;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;

            &:hover {
                color: $text;
                background: rgba(0, 0, 0, 0.05);
            }
        }
    }
</style>
