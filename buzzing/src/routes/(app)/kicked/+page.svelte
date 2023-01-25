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
    <h1>Kicked</h1>
    <p>You have been kicked from the game by a moderator</p>
</main>