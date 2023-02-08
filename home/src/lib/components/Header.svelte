<script lang="ts">
    import { enhance, type SubmitFunction } from "$app/forms";
    import { invalidateAll } from "$app/navigation";
    import { page } from "$app/stores";


    export let loggedIn: boolean

    let loginMenuVisible = false
    let loginMenuWrapper: HTMLElement

    let email = ""
    let password = ""
    $: error = $page.form?.error

    function handleWindowClick(e: MouseEvent) {
        if (loginMenuWrapper && !loginMenuWrapper.contains(e.target as Node)) {
            loginMenuVisible = false
        }
    }

    const handleSubmit: SubmitFunction = () => async ({ update, result }) => {
        if (result.type === "redirect") {
            await invalidateAll();
        }
        await update();
    }
</script>

<svelte:window on:click={handleWindowClick}></svelte:window>

<div id="header">
    <a href="/" class="title-anchor"><h1 id="title">ESBOT</h1></a>
    <div id="right">
        {#if loggedIn}
            <nav>
                <a href="/edit">Edit Team</a>
                <form action="/?/logout" method="POST">
                    <button class="login" type="submit">Logout</button>
                </form>
            </nav>
        {:else}
            <nav>
                <a href="/register">Register Now</a>
                <div class="login-menu-wrapper" bind:this={loginMenuWrapper}>
                    <button class="login" on:click={() => {loginMenuVisible = !loginMenuVisible}}>Login</button>
                    <form action="/?/login" method="POST" class="login-menu" class:visible={loginMenuVisible} use:enhance={handleSubmit}>
                        <label for="email">Email</label>
                        <input id="email" name="email" type="text" bind:value={email} autocomplete="off" />
                        <label for="password">Password</label>
                        <input id="password" name="password" type="password" bind:value={password} autocomplete="off" />
                        <a href="/forgot-password" on:click={() => loginMenuVisible = false}>Forgot Password?</a>
                        <button type="submit">Login</button>
                        {#if error}
                            <p class="error">{error}</p>
                        {/if}
                    </form>
                </div>
            </nav>
        {/if}
    </div>
</div>

<style lang="scss">
    #header {
        background: var(--color-5);
        position: sticky;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 5;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
    
    h1 {
        display: inline-block;
        margin-left: 0.75em;
        margin-top: 0.75em;
    }
    
    #right {
        margin: 0.5em 1em 0.5em 0;
        display: inline-flex;
        flex-direction: row;
        align-items: center;
        font-size: 32px;
        width: min-content;
        float: right;

        @media (max-width: 650px) {
            width: 100%;
            justify-content: center;
            font-size: 24px;
        }
    }

    button:not(.login) {
        padding: 0.5em;
        margin: .5em auto;
        width: 100%;
        color: #EEE;
        background: var(--color-2);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 18px;
        cursor: pointer;
        

        &:disabled {
            border: solid var(--color-2) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }
    }

    nav {
        display: flex;
        flex-direction: row;
        gap: 1em;

        a {
            text-decoration: none;
            color: inherit;
            transition: color 0.3s;
            cursor: pointer;
            white-space: nowrap;

            &:hover {
                color: var(--color-2)
            }
        }

        button.login {
            background: none;
            border: none;
            text-decoration: none;
            color: inherit;
            transition: color 0.3s;
            cursor: pointer;
            white-space: nowrap;
            font-size: inherit;

            &:hover {
                color: var(--color-2)
            }
        }
    }

    .title-anchor {
        @media (max-width: 650px) {
            display: none;
        }
        color: black;
        transition: color 0.3s;
        &:hover {
            color: var(--color-2)
        }
    }

    .login-menu-wrapper {
        position: relative;
    }

    .error {
        color: red;
        font-size: 12pt;
        margin: 0em
    }

    .login-menu {
        position: absolute;
        top: 1.25em;
        right: 0;
        background: white;
        border-radius: 10px;
        padding: 0.75em;
        display: none;

        &.visible {
            display: block;
        }
    }

    form a {
        font-size: 18px;
        color: blue;
        text-decoration: underline;

        &:hover {
            color: blue;
        }
    }

    label {
        font-size: 18px;
    }

    input {
        padding: 0.3em;
        border-radius: 0.5em;
        outline: none;
        border: 2px solid black;
        transition: border-color 0.3s;
        
        &:hover, &:focus {
            border-color: var(--color-2);
        }
    }
</style>