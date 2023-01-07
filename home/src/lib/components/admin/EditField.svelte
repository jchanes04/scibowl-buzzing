<script lang="ts">
    import { enhance, type SubmitFunction } from "$app/forms"
    export let headerText: string
    export let initialValue: string
    export let userId: string
    export let actionName: string
    export let cancelCallback: () => void
    export let confirmCallback: (data: FormData) => void
    
    let value = initialValue

    const handleSubmit: SubmitFunction = ({ data }) => async ({ update }) => {
        confirmCallback(data)
        await update()
    }
</script>

<div class="rename-user-modal">
    <h2>{headerText}</h2>
    <form action="/admin?/{actionName}" method="POST" use:enhance={handleSubmit}>
        <input type="hidden" name="user-id" value={userId} />
        <input type="text" name={actionName} bind:value />
        <br /><br />
        <button type="button" on:click={cancelCallback}>Cancel</button>
        <button type="submit">Confirm</button>
    </form>
</div>

<style lang="scss">
    .rename-user-modal {
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