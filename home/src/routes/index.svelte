<script lang="ts">
import SubjectMenu from "$lib/components/SubjectMenu.svelte";


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
        <h2>Revolutionary Buzzing System</h2>
        <p>Say goodbye to shitty latency. Enloe Science Bowl has developed a websocket based buzzng system with ultra low latency that will appease even the biggest gamers. With integrated scoring, challenge and moderation tools, the enloe science bowl online buzzing system is perfect for all online science bowl gameplay. This is the closest we've ever gotten to emulateing real, in-person science bowl.</p>
    </section>
    <section class='bubble'>
        <h2>Skilled Writers and Testsolvers</h2>
        <SubjectMenu>
            <div slot="bio">
                <p>bio sample</p>
            </div>
            <div slot="earth">
                <p>earth sample</p>
            </div>
            <div slot="chem">
                <p>chem sample</p>
            </div>
            <div slot="physics">
                <p>physics sample</p>
            </div>
            <div slot="math">
                <p>math sample</p>
            </div>
        </SubjectMenu>
    </section>
    <section class='bubble'>
        <h2>Samples</h2>
        <SubjectMenu>
            <div slot="bio">
                <p>bio sample</p>
            </div>
            <div slot="earth">
                <p>earth sample</p>
            </div>
            <div slot="chem">
                <p>chem sample</p>
            </div>
            <div slot="physics">
                <p>physics sample</p>
            </div>
            <div slot="math">
                <p>math sample</p>
            </div>
        </SubjectMenu>
    </section>
    <a href='https://science.osti.gov/wdts/nsb/Regional-Competitions/Resources/HS-Sample-Questions#set13'><h2 class="info">Rules</h2></a>
</main>


<style lang="scss">
    h1  {
        font-size: 120pt;
        margin: .2em .0em .1em 0;
        letter-spacing: .1em;
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
