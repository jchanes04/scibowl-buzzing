<svelte:head>
    <title>Session Replaced</title>
</svelte:head>

<main>
    <h1>Session Replaced</h1>
    <p>You have joined the game from another browser tab or device.</p>
    <p>This session has been disconnected.</p>
    <a href="/">Return to Home</a>
</main>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    main {
        text-align: center;
        padding: 3rem;
        max-width: 500px;
        margin: 2rem auto;
        background: $background-1;
        border-radius: 1.5rem;
        box-shadow: $shadow;
        border: 3px solid $border-color;
    }

    h1 {
        font-size: 2rem;
        font-weight: 800;
        margin-bottom: 1rem;
        color: $text;
    }

    p {
        font-size: 1.1rem;
        color: $gray-2;
        margin-bottom: 1rem;
    }

    a {
        @extend %button;
        display: inline-block;
        margin-top: 1rem;
        text-decoration: none;
    }
</style>
