<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    onMount(() => {
        setTimeout(() => {
            goto('/create')
        }, 5000)
    })
</script>

<main>
    <h1>Invalid Create</h1>
    <p>An error occurred while creating the game</p>
</main>