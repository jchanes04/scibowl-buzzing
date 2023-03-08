<script lang="ts">
</script>

<main>    
    <section id="hero">
        <h1>Welcome to the Enloe Science Bowl Buzzing System</h1>
        <a href='/create'><h3 style="display: inline-block;">Create a Game</h3></a>
        <br />
        <a href='/join'><h3 style="display: inline-block;">Join an Existing Game</h3></a>
    </section>

    <section class='bubble'>
        <h2>Revolutionary Buzzing System</h2>
        <p>
            Say goodbye to latency. Enloe Science Bowl has developed a websocket based buzzng system with ultra low latency that will appease even the biggest gamers.
            With integrated scoring, challenge and moderation tools, the Enloe Science Bowl online buzzing system is perfect for all online Science Bowl gameplay.
            This is the closest we've ever gotten to emulating real, in-person Science Bowl.
        </p>
    </section>
</main>


<style lang="scss">
    @use '$styles/_global.scss' as *;
    
    h1  {
        font-size: 80px;
        margin: .2em .0em .1em 0;
    }
    
    
    h2 {
        font-size: 50px;
        margin: 0 0 .3em 0;
    }
    h3 {
        font-size: 40px;
    }
    
    #hero {
        position: relative;
        padding: 0 5em;

    }
    main {
        margin: 0 5vw;
    }

    p {
        font-size: 20px;
        margin: 0;
    }

    .bubble {
        border-radius: 15px;
        background-color: $green;
        padding: 3em;
        color:white;
        margin: 2em 0;
    }
</style>
