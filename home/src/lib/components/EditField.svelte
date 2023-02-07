<script lang="ts">
    import { enhance, type SubmitFunction } from "$app/forms"
    import type { ActionResult } from "@sveltejs/kit";
    export let headerText: string
    export let initialValue: string
    export let actionName: string
    export let hiddenInputs: Record<string, string> = {}
    export let cancelCallback: () => void
    export let confirmCallback: (data?: FormData, result?: ActionResult) => void
    
    let value = initialValue

    const handleSubmit: SubmitFunction = ({ data }) => async ({ result, update }) => {
        confirmCallback(data, result)
        await update()
    }
</script>

<div class="rename-user-modal">
    <h2>{headerText}</h2>
    <form action="?/{actionName}" method="POST" autocomplete="off" use:enhance={handleSubmit}>
        {#each Object.entries(hiddenInputs) as [k, v]}
            <input type="hidden" name={k} value={v} />
        {/each}
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