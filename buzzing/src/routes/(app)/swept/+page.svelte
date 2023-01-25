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
    <h1>Game Swept</h1>
    <p>Your game has been ended for being inactive for too long</p>
</main>