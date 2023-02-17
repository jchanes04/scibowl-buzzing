<script lang="ts">
    import { enhance } from "$app/forms";
    import type { ActionData } from "./$types";

    export let form: ActionData

    let email: string = ""
</script>

<svelte:head>
    <title>Forgot Password</title>
</svelte:head>

<main>
    <h1>Forgot Password</h1>
    {#if form}
        <p>An email has been sent with a link to reset your password.</p>
    {:else}
        <form method="POST" use:enhance>
            <label for="email" class="required">Email</label>
            <input id="email" type="email" name="email" bind:value={email} />
            <br />
            <button type="submit" disabled={email.length < 5}>Submit</button>
        </form>
    {/if}
</main>

<style lang="scss">
    form {
        margin: 0 calc(5vw + 3em) 5em;
    }
    
    h1  {
        font-size: 80px;
        margin: .4em .0em 0.8em 5vw;

        @media (max-width: 900px) {
            font-size: 60px;
        }

        @media (max-width: 700px) {
            text-align: center;
            font-size: 40px;
        }

        @media (max-width: 550px) {
            font-size: 30px;
        }
        @media (max-width: 350px) {
            font-size: 60px;
        }
    }

    p {
        margin-left: 5vw;
    }

    input[type="email"] {
        padding: 0.3em;
        font-size: 20px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        max-width: 80%;
        text-align: left;
        font-family: 'Ubuntu';
        position: relative;
        &:focus::placeholder {
            color: transparent;
        }
    }

    button {
        padding: 0.5em;
        color: #EEE;
        background: var(--color-2);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 24px;
        cursor: pointer;
        width: 8ch;
        margin-top: 1em;
        
        &:disabled {
            border: solid var(--color-2) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }

        @media (max-width: 700px) {
            margin: 1em 2em;
            width: calc(100% - 4em);
        }
    }

    label {
        font-size: 20pt;
        margin: 1em 0 .1em 0;
        display: block;

        &.required::after {
            content: ' *';
            color: red;
        }
    }
</style>