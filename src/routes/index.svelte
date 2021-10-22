<script lang="ts">
    import { session } from '$app/stores'
</script>

<svelte:head>
    <title>Enloe Science Bowl</title>
</svelte:head>

<main>
    <h1>{$session.isLoggedIn ? "logged in" : "not logged in"}</h1>
</main>