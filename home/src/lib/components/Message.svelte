<script lang="ts">
    export let headerText: string
    export let message: string
    export let closeCallback: () => void
</script>

<div class="confirm-modal">
    <h2>{headerText}</h2>
    <p>{message}</p>
    <button on:click={closeCallback}>Close</button>
</div>

<style lang="scss">
    .confirm-modal {
        background: var(--color-5);
        border-radius: 15px;
        min-width: 200px;
        text-align: center;
        padding: 1em 2em;
    }

    button {
        padding: 0.5em;
        margin-left: 1em;
        color: #EEE;
        background: var(--color-2);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 16px;
        cursor: pointer;
        
        &:disabled {
            border: solid var(--color-2) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }
    }
</style>