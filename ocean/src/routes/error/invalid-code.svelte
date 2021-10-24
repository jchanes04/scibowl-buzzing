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
    <title>Invalid Join Code</title>
</svelte:head>

<div>
    <h1>Invalid Join Code</h1>
    <p>There is no game with that join code</p>
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