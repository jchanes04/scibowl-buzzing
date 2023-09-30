<script lang="ts">
    export let oldName: string
    export let confirmCallback: (newName: string) => void
    export let cancelCallback: () => void

    let newName = oldName

    function confirm() {
        confirmCallback(newName)
    }
</script>

<div class="modal">
    <h2>Edit Game Name</h2>
    <input type="text" bind:value={newName} />
    <br />
    <button on:click={confirm}>Save Changes</button>
    <button on:click={cancelCallback}>Cancel</button>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    .modal {
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
</style>