<script lang="ts">
    import ThemeSelector from "./ThemeSelector.svelte";
    import LoginButton from "./LoginButton.svelte";
</script>

<div class="header">
    <a href="/"
        ><h1 class="title">
            ESBOT <span class="buzzing-text">Buzzing</span>
        </h1></a
    >
    <nav>
        <a href="/join" class="game-link"
            >Join <span class="game-text">Game</span></a
        >
        <a href="/create" class="game-link"
            >Create <span class="game-text">Game</span></a
        >
        <LoginButton />
        <div class="theme-selector">
            <ThemeSelector />
        </div>
    </nav>
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    .header {
        background: $background-2;
        text-align: left;
        position: sticky;
        top: 0;
        left: 0;
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
        z-index: 5;
        padding: 0.5em 1.5em;
        box-shadow: $shadow;
        box-sizing: border-box;
    }

    h1 {
        display: inline-block;
        margin: 0;
        font-size: 3rem;
        font-weight: 700;
        color: $primary;
        margin-right: 0.5em;

        .buzzing-text {
            @media (max-width: 1100px) {
                display: none;
            }
        }
    }

    nav {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 1em;
        margin-left: auto;
        font-size: 2rem;
        font-weight: 500;
    }

    a {
        text-decoration: none;
        color: $text;

        transition: all 0.2s;

        &:hover {
            color: $primary;
        }

        .game-text {
            @media (max-width: 900px) {
                display: none;
            }
        }

        &.game-link {
            @media (max-width: 550px) {
                display: none;
            }
        }
    }

    .theme-selector {
        display: block;

        @media (max-width: 750px) {
            display: none;
        }
    }
</style>
