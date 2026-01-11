<script lang="ts">
    import ThemeSelector from "./ThemeSelector.svelte";
    import LoginButton from "./LoginButton.svelte";
</script>

<div class="header">
    <h1 class="title">ESBOT</h1>
    <div class="right">
        <nav>
            <a href="/join">Join Game</a>
            <a href="/create">Create Game</a>
            <LoginButton />
            <ThemeSelector />
        </nav>
    </div>
</div>


<style lang="scss">
    @use "$styles/_global.scss" as *;

    .header {
        background: $background-1;
        text-align: left;
        width: 100%;
        z-index: 5;
    }

    h1 {
        display: inline-block;
        margin: 0.25em 0em 0.25em 0.75em;
        font-size: 36px;
        font-weight: 600;

        @media (max-width: 800px) {
            display: none;
        }
    }

    .right {
        display: inline-flex;
        float: right;
        flex-direction: row;
        align-items: center;
        vertical-align: middle;
        font-size: 30px;
        height: 100%;
        margin-bottom: 0.5em;
        margin-right: 0.75em;
    }

    nav {
        display: flex;
        flex-direction: row;
        gap: 1em;
    }

    a {
        text-decoration: none;
        color: inherit;
        transition: color 0.3s;
        margin: auto;

        &:hover {
            color: $primary;
        }

        @media (max-width: 800px) {
            margin: 0.5em 0;
        }
    }

</style>
