<script lang="ts">
    let displayTab: string = 'bio'
    
    function switchTab(element,category) {
        displayTab= category
    }
</script>

<main>    
    <section id="hero">
        <h1>ESBOT</h1>
        <h3>Enloe Sciece Bowl Online Tournament</h3>
        <h3> Registration is Open! Register here.</h3>
    </section>

    <section class='bubble'>
        <h2>Revolutionary Buzzing Sytem</h2>
        <p>Say goodbye to shitty latency. Enloe Science Bowl has developed a websocket based buzzng system with ultra low latency that will appease even the biggest gamers. With integrated scoring, challenge and moderation tools, the enloe science bowl online buzzing system is perfect for all online science bowl gameplay. This is the closest we've ever gotten to emulateing real, in-person science bowl.</p>
    </section>
    <section class='bubble'>
        <h2>Skilled Writers and Testsolvers</h2>
        <div id='tabs' style="display: flex">
            <div class:active={displayTab=='bio'} class:inactive={displayTab!='bio'}  on:click={() => displayTab='bio'}><p>Bio</p></div>
            <div class:active={displayTab=='che'} class:inactive={displayTab!='che'}  on:click={() => displayTab='che'}><p>Chem</p></div>
            <div class:active={displayTab=='phy'} class:inactive={displayTab!='phy'}  on:click={() => displayTab='phy'}><p>Physics</p></div>
            <div class:active={displayTab=='ear'} class:inactive={displayTab!='ear'}  on:click={() => displayTab='ear'}><p>Earth And Space</p></div>
            <div class:active={displayTab=='mat'} class:inactive={displayTab!='mat'}  on:click={() => displayTab='mat'}><p>Math</p></div>
        </div>
        <div>
            {#if displayTab=='bio'}
                <div class='displayedTab'>
                    <p>hahahah</p>
                </div>
            {:else if displayTab=='che'}
                <div class='displayedTab'>
                    <p>chem :)</p>
                </div>
            {:else if displayTab=='phy'}
                <div class='displayedTab'>
                    <p>physics :)</p>
                </div>
            {:else if displayTab=='ear'}
                <div class='displayedTab'>
                    <p>earth :)</p>
                </div>
            {:else if displayTab=='mat'}
                <div class='displayedTab'>
                    <p>math :)</p>
                </div>
            {/if}
        </div>
    </section>
    <a href='https://science.osti.gov/wdts/nsb/Regional-Competitions/Resources/HS-Sample-Questions#set13'><h2 class="info">Samples</h2></a>
    <h2 class="info">Rules</h2>
</main>


<style lang="scss">
    h1  {
        font-size: 120pt;
        margin: .2em .0em .1em 0;
        letter-spacing: .1em;
    }

    .active{
        background-color: var(--color-3);
        padding:.1em 1em;
        border-radius: .5em .2em 0em 0em;
    }
    .inactive{
        background-color: var(--color-6);
        padding:.1em 1em;
        border-radius: .5em .2em 0em 0em;
    }
    h2 {
        font-size: 50px;
        margin: 0 0 .3em 0;
    }
    h3 {
       font-size: 40px;
    }
    .info {
        margin: .5em;
    }
    .displayedTab{
        padding: 1em;
        border-radius: 0 .5em .5em .5em;
        background-color: var(--color-3);
    }

    .info::before {
        content: '';
        height: 1.1em;
        width: 0.07em;
        position: relative;
        bottom: -0.18em;
        background-color: currentColor;
        display: inline-block;
        margin-right: 0.5em;
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
        background-color: var(--color-2);
        padding: 3em;
        color:white;
        margin: 2em 0;
     }
</style>
