<script lang="ts">
    // This page will be handled by the server load function
    // and will redirect before rendering
</script>

<svelte:head>
    <title>Authenticating...</title>
</svelte:head>

<div class="loading">
    <h1>Authenticating...</h1>
    <p>Please wait while we sign you in.</p>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    .loading {
        text-align: center;
        padding: 4rem 2rem;
    }

    h1 {
        font-size: 2rem;
        color: $text-dark;
        margin-bottom: 1rem;
    }

    p {
        font-size: 1.2rem;
        color: $gray-2;
    }
</style>
