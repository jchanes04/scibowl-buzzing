<script lang="ts">
    import { run } from "svelte/legacy";

    interface Props {
        title: string;
        message: string;
        options: Record<string, unknown>;
        confirmCallback: (value: string) => void;
        cancelCallback: () => void;
    }

    let { title, message, options, confirmCallback, cancelCallback }: Props = $props();

    let opts = $state(options as { defaultValue: string; fieldName: string });
    run(() => {
        opts = options as { defaultValue: string; fieldName: string };
    });
    let value = $state(opts.defaultValue);
</script>

<div class="text-field-modal">
    <h2>{title}</h2>
    <p>{message}</p>
    <input type="text" bind:value placeholder={opts.fieldName} /><br /><br />
    <button onclick={cancelCallback}>Cancel</button>
    <button onclick={() => confirmCallback(value)}>Confirm</button>
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    .text-field-modal {
        background: $background-2;
        border-radius: 15px;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 2em;
    }

    button {
        @extend %button;

        font-size: 20px;
        padding: 0.6em;
        border-radius: 0.6em;
    }

    input {
        @extend %text-input;
    }
</style>
