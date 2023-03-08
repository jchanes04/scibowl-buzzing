<script lang="ts">

    
</script>

<div class="header">
    <h1 class="title">ESBOT</h1>
    <div class="right">
        <nav>
            <a href="/join">Join Game</a>
            <a href="/create">Create Game</a>
        </nav>
    </div>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    .header {
        background: white;
        text-align: left;
        width: 100%;
        z-index: 5;
    }
    
    h1 {
        display: inline-block;
        margin: 0.25em 0em 0.25em 0.75em; 
        font-size: 32px;

        @media (max-width: 800px) {
            display: none;
        }
    }
    
    .right {
        margin-right: 1em;
        display: inline-flex;
        float: right;
        flex-direction: row;
        align-items: center;
        font-size: 20px;
        height: 100%;
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

        &:hover {
            color: adjust($green, $lightness: -20%);
        }

        @media (max-width: 800px) {
            margin: 0.5em 0;
        }
    }
</style>