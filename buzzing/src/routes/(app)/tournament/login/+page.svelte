<script lang="ts">
    import { enhance } from "$app/forms";

    let tournamentCode = ""
    let password = ""
</script>

<svelte:head>
    <title>Tournament Manager Login</title>
</svelte:head>

<main>
    <h1>Tournament Manager Login</h1>
    <form method="POST" use:enhance>
        <input type="text" placeholder="Tournament Code" name="tournament-code" bind:value={tournamentCode} />
        <br />
        <input type="password" placeholder="Password" name="password" bind:value={password} />
        <br />
        <button type="submit" disabled={!tournamentCode || !password}>Submit</button>
    </form>
</main>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    main {
        text-align: center;
    }

    h1 {
        font-size: 44px;
        text-decoration: underline $blue 3px;
        text-underline-offset: 0.2em;
    }

    input {
        @extend %text-input;

        font-size: 24px;
        margin: 0.5em auto;
        width: 25ch;
        max-width: 80vw;
        text-align: center;
    }

    button {
        @extend %button;

        font-size: 18px;
    }
</style>