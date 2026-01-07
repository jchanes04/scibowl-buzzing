<script lang="ts">
    import ThemeSelector from "./ThemeSelector.svelte";
</script>

<div class="header">
    <a href="/"><h1 class="title">ESBOT Buzzing</h1></a>
    <nav>
        <a href="/join">Join Game</a>
        <a href="/create">Create Game</a>
        <ThemeSelector />
    </nav>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

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

        @media (max-width: 800px) {
            display: none;
        }
    }

    nav {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 1.5em;
        margin-left: auto;
        font-size: 2rem;
        font-weight: 500;
    }
    
    a {
        text-decoration: none;
        color: $text-dark;
        
        transition: all 0.2s;

        &:hover {
            color: $primary;
        }
    }
</style>