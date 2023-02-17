<script lang="ts">
    export let title: string
    export let message: string
    export let confirmCallback: () => void
    export let cancelCallback: () => void
</script>

<div class="confirm-modal">
    <h2>{title}</h2>
    <p>{message}</p>
    <button on:click={cancelCallback}>Cancel</button>
    <button on:click={confirmCallback}>Confirm</button>
</div>

<style lang="scss">
    .confirm-modal {
        background: var(--color-5);
        border-radius: 15px;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    button {
        color: #EEE;
        background: var(--green);
        font-size: 20px;
        font-weight: bold;
        padding: 0.6em;
        border-radius: 0.6em;
        border: solid black 3px;
        cursor: pointer;
    }
</style>