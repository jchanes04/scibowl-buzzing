<script lang="ts">
    import { session } from '$app/stores'
</script>

<svelte:head>
    <title>Scibowl Buzzing</title>
</svelte:head>

<main>
    <h1>{$session.isLoggedIn ? "logged in" : "not logged in"}</h1>
</main>