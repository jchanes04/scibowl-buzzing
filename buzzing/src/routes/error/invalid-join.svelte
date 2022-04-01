<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    onMount(() => {
        setTimeout(() => {
            goto('/join')
        }, 5000)
    })
</script>

<main>
    <h1>Invalid Create</h1>
    <p>An error occurred while joining the game</p>
</main>