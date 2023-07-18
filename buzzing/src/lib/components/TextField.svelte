<script lang="ts">
    export let title: string
    export let message: string
    export let options: Record<string, unknown>
    export let confirmCallback: (value: string) => void
    export let cancelCallback: () => void;

    let opts = options as { defaultValue: string, fieldName: string }
    $: opts = options as { defaultValue: string, fieldName: string }
    let value = opts.defaultValue
</script>

<div class="text-field-modal">
    <h2>{title}</h2>
    <p>{message}</p>
    <input type="text" bind:value placeholder={opts.fieldName} /><br /><br />
    <button on:click={cancelCallback}>Cancel</button>
    <button on:click={() => confirmCallback(value)}>Confirm</button>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

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