<script lang="ts">
    export let loggedIn: boolean

    let loginMenuVisible = false
    let loginMenuWrapper: HTMLElement

    let email = ""
    let password = ""
    let error = null

    function handleWindowClick(e: MouseEvent) {
        if (loginMenuWrapper && !loginMenuWrapper.contains(e.target as Node)) {
            loginMenuVisible = false
        }
    }
</script>

<svelte:window on:click={handleWindowClick}></svelte:window>

<div id="header">
    <a href="/" class="title-anchor"><h1 id="title">ESBOT</h1></a>
    <div id="right">
        {#if loggedIn}
            <nav>
                <a href="/edit">Edit Team</a>
                <a href="/api/logout" rel="external">Logout</a>
            </nav>
        {:else}
            <nav>
                <!-- <a href="/register">Register Now</a> -->
                <div class="login-menu-wrapper" bind:this={loginMenuWrapper}>
                    <span on:click={() => {loginMenuVisible = !loginMenuVisible}}>Login</span>
                    <form action="/api/login" method="POST" class="login-menu" class:visible={loginMenuVisible}>
                        <label for="email">Email</label>
                        <input id="email" name="email" type="text" bind:value={email} autocomplete="off" />
                        <label for="password">Password</label>
                        <input id="password" name="password" type="password" bind:value={password} autocomplete="off" />
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
    button {
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

        span, a {
            text-decoration: none;
            color: inherit;
            transition: color 0.3s;
            cursor: pointer;
            white-space: nowrap;

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