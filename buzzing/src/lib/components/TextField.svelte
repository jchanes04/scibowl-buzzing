<script lang="ts">
    interface Props {
        title: string;
        message: string;
        options: Record<string, unknown>;
        confirmCallback: (value: string) => void;
        cancelCallback: () => void;
    }

    let { title, message, options, confirmCallback, cancelCallback }: Props =
        $props();

    let opts = $derived(options as { defaultValue: string; fieldName: string });
    let value = $state("");
    $effect.pre(() => {
        value = (options as { defaultValue: string }).defaultValue;
    });
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
        background: $background-1;
        border-radius: 1.5rem;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 2.5rem;
        box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
        border: 1px solid $border-color;
        width: 90%;
        max-width: 450px;
        z-index: 100;
        text-align: center;
    }

    h2 {
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
        font-weight: 800;
        color: $text-dark;
    }

    p {
        margin: 0 0 1.5rem 0;
        font-size: 1.1rem;
        color: $gray-2;
        line-height: 1.5;
    }

    input {
        @extend %text-input;
        width: 100%;
        font-size: 1.1rem;
        margin-bottom: 2rem;
    }

    button {
        @extend %button;
        font-size: 1rem;
        padding: 0.75rem 1.5rem;
        margin: 0 0.5rem;

        &:first-of-type {
            background: $gray-1;
            color: $gray-2;
            box-shadow: none;

            &:hover {
                filter: brightness(0.95);
            }
        }
    }
</style>
