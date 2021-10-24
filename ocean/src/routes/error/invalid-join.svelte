<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    onMount(() => {
        setTimeout(() => {
            goto('/join')
        }, 3000)
    })
</script>

<svelte:head>
    <title>Invalid Join</title>
</svelte:head>

<div>
    <h1>Error</h1>
    <p>The join request was malformed, or another error occurred</p>
</div>

<style lang="scss">
    div {
        text-align: center;
        margin: 3em auto;
    }
    
    h1 {
        font-size: 44px;
        text-decoration: underline var(--red) 3px;
        text-underline-offset: 0.2em;
    }
</style>