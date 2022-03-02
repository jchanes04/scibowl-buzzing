<script lang="ts">
    export let loggedIn: boolean

    let loginMenuVisible = false
    let loginMenuWrapper: HTMLElement

    let username = ""
    let password = ""
    let error = null

    function handleWindowClick(e: MouseEvent) {
        if (loginMenuWrapper && !loginMenuWrapper.contains(e.target as Node)) {
            loginMenuVisible = false
        }
    }

    async function login() {
        const res = await fetch('/api/login', {
            body: new URLSearchParams({
                username,
                password
            }),
            method: "POST"
        })

        if ((await res.json()).correct) {
            window.location.href = "/edit"
        } else {
            error = "Username or password is incorrect"
        }
    }
</script>

<svelte:window on:click={handleWindowClick}></svelte:window>

<div id="header">
    <a href="/"><h1 id="title">ESBOT</h1></a>
    <div id="right">
        {#if loggedIn}
            <nav>
                <a href="/edit" sveltekit:prefetch>Edit Team</a>
                <a href="/api/logout" rel="external">Logout</a>
            </nav>
        {:else}
            <nav>
                <a href="/register">Register Now</a>
                <div class="login-menu-wrapper" bind:this={loginMenuWrapper}>
                    <span on:click={() => {loginMenuVisible = !loginMenuVisible}}>Login</span>
                    <div class="login-menu" class:visible={loginMenuVisible}>
                        {#if error}
                            <p class="error">{error}</p>
                        {/if}
                        <label for="username">Username</label>
                        <input id="username" type="text" bind:value={username} autocomplete="off" />
                        <label for="password">Password</label>
                        <input id="password" type="password" bind:value={password} autocomplete="off" />
                        <button on:click={login}>Login</button>
                    </div>
                </div>
            </nav>
        {/if}
    </div>
</div>

<style lang="scss">
    #header {
        background: var(--color-5);
        text-align: left;
        position: sticky;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 5;
    }
    
    h1 {
        display: inline-block;
        margin-left: 0.75em;
        margin-top: 0.75em;

        @media (max-width: 800px) {
            visibility: hidden;
        }
    }
    
    #right {
        position: absolute;
        top: .57em;
        right: 1em;
        display: flex;
        flex-direction: row;
        align-items: center;
        font-size: 32px;
    }

    nav {
        display: flex;
        flex-direction: row;
        gap: 1em;

        span, a {
            text-decoration: none;
            color: inherit;
            transition: color 0.3s;
            cursor: pointer;

            &:hover {
                color: var(--color-2)
            }
        }
    }

    .login-menu-wrapper {
        position: relative;
    }

    .error {
        color: red;
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