<script lang="ts">

    
</script>

<div class="header">
    <a href="/"><h1 class="title">ESBOT Buzzing</h1></a>
    <nav>
        <a href="/join">Join Game</a>
        <a href="/create">Create Game</a>
    </nav>
</div>

<style lang="scss">
    .header {
        background: white;
        text-align: left;
        position: sticky;
        top: 0;
        left: 0;
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
        z-index: 5;
    }
    
    h1 {
        display: inline-block;
        margin-left: 0.75em;
        margin-top: 0.75em;

        @media (max-width: 800px) {
            display: none;
        }
    }

    nav {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 1em;
        margin: 0.5em 1em 0.5em auto;
        font-size: 32px;
    }
    
    a {
        text-decoration: none;
        color: inherit;
        transition: color 0.3s;

        &:hover {
            color: #006242;
        }
    }
</style>