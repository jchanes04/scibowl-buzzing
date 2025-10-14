<script lang="ts">
    interface Props {
        oldName: string;
        confirmCallback: (newName: string) => void;
        cancelCallback: () => void;
    }

    let { oldName, confirmCallback, cancelCallback }: Props = $props();

    let newName = $state(oldName);

    function confirm() {
        confirmCallback(newName);
    }
</script>

<div class="modal">
    <h2>Edit Game Name</h2>
    <input type="text" bind:value={newName} />
    <br />
    <button onclick={confirm}>Save Changes</button>
    <button onclick={cancelCallback}>Cancel</button>
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

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
