<script lang="ts">
    import SubjectMenu from "$lib/components/SubjectMenu.svelte";
    import StaffCard from "$lib/components/StaffCard.svelte";
</script>

<svelte:head>
    <title>Enloe Science Bowl Online Tournament</title>
    <meta name="description" content="An online Science Bowl tournament hosted by Enloe High School." />
</svelte:head>

<main>    
    <section id="hero">
        <h1>ESBOT</h1>
        <h3 style="margin-top: 0;">Enloe Science Bowl Online Tournament</h3>
        <h3 style="margin-bottom: 0.2em;">Registration for ESBOT 2023 has closed</h3>
        <br /><br />
    </section>

    <section class='bubble'>
        <h2>Revolutionary Buzzing System</h2>
        <p>
            Say goodbye to latency. Enloe Science Bowl has developed a websocket based buzzing system with ultra low latency that will appease even the biggest gamers.
            With integrated scoring, statistics, and moderation tools, the Enloe Science Bowl online buzzing system is perfect for all online Science Bowl gameplay.
            This is the closest we've ever gotten to emulating real, in-person Science Bowl.
        </p>
        <br />
        <p><a href="https://buzzing.enloesciencebowl.xyz">Buzzing website</a></p>
    </section>
    <section class='bubble'>
        <h2>Tournament Information</h2>
        <p>
            ESBOT 2023 will be held on <b><time datetime="2022-03-26">March 26th</time></b>.
            The tournament will be held in the style of <b>in-person Science Bowl</b> through an online medium.
            The format will consist of a round-robin portion followed by a double elimination tournament.
            The tournament will take place from 9:40 AM to 7:15 PM EDT, with more detailed times available on the <a href="/schedule">schedule</a>.
        </p>
        <br />
        <p>
            ESBOT will be run through the <b>Discord server</b> which can be found <a href="https://discord.gg/YG468EnsJ7">here</a>. Each match will be run over Discord voice chat, with Zoom as a fallback in case of technical difficulties.
            <b>All competitors should join</b> the Discord server as soon as possible in order to stay up to date and be ready for competition day.
        </p>
        <br />
        <p>
            There will be cash prizes available to the top scoring teams, as well as the top individual scorer in each category. Prize amounts will be determined closer to the competition day. 
        </p>
        <br />
        <p>
            There will be a $20 registration fee for each team competing.
        </p>
    </section>
    <section class='bubble'>
        <h2>Skilled Writers</h2>
        <div id="staff">
            <StaffCard name="Colin Hanes" grade="Senior" categories="Physics, Chemistry">- USAPhO Bronze Medalist<br/>- USNCO Semifinalist <br/>- Science Olympiad National Medalist<br/>- AIME Qualifier<br />- USABO Semifinalist<br />- USESO Camp Qualifier</StaffCard>
            <StaffCard name="Rohit Hari" grade="Senior" categories="Earth and Space, Chemistry">- US Team: International Earth Science Olympiad<br />- USNCO Honors<br/>- USAPhO Semifinalist<br/>- AIME Qualifer</StaffCard>
            <StaffCard name="Rishabh Bedidha" grade="Senior" categories="Biology, Math">- USABO Semifinalist<br/>- Science Olympiad National Medalist<br/>- AIME Qualifier</StaffCard>
            <StaffCard name="Brian Zhang" grade="Junior" categories="Math, Physics, Earth and Space">- US Team: International Astronomy Olympiad Bronze Medal<br/>- AIME Qualifer<br />- Mathcounts Nationals Qualifier</StaffCard>
            <StaffCard name="Nikhil Vemuri" grade="Sophomore" categories="Chemistry">- USNCO Semifinalist<br />- National Science Olympiad Invitational Medalist</StaffCard>
            <StaffCard name="Sukrith Velmineti" grade="Senior" categories="Earth and Space, Math">- AIME Qualifier<br/>- National Science Olympiad Invitational Medalist<br />- Canada Team: International Olympiad in Linguistics</StaffCard>
            <StaffCard name="Vedang Singhal" grade="Senior" categories="Biology, Earth and Space">- USABO Top 125<br />-USESO Camper<br />- National Science Olympiad Invitational Medalist<br/>- HOSA Internationals Top 10</StaffCard>
            <StaffCard name="Siddharth Sivakumar" grade="Senior" categories="Earth and Space">- National Science Olympiad Invitational Medalist</StaffCard>
            <StaffCard name="Andy Sun" grade="Sophomore" categories="Math">- AIME Qualifier<br />- National Science Olympiad Invitational Medalist<br />- AMC 8 Honor Roll</StaffCard>
            <StaffCard name="Serena Zhang" grade="Freshman" categories="Biology">- Science Olympiad National Qualifier<br />- Science Olympiad State Medalist</StaffCard>
            <StaffCard name="Brandon Yang" grade="Sophomore" categories="Math, Physics">- Mathcounts State Finalist<br />- Science Olympiad National Qualifier<br />- AMC 8 Honor Roll<br />- Ready, Set, App! Seminfinalist</StaffCard>
            <StaffCard name="Jerry Cao-Xue" grade="Freshman" categories="Biology, Math">- AIME Qualifier<br />- Science Olympiad State Medalist</StaffCard>
            <StaffCard name="Angelina Li" grade="Freshman" categories="Earth and Space">- Science Olympiad National Qualifer<br />- Science Olympiad State Medalist</StaffCard>
            <StaffCard name="Thanush Patlolla" grade="Sophomore" categories="Physics, Math"></StaffCard>
            <StaffCard name="Kaiwen Yao" grade="Freshman" categories="Physics, Chemistry"></StaffCard>
        </div>
    </section>
    <section class='bubble'>
        <h2>Samples</h2>
        <SubjectMenu>
            <div slot="bio">
                <p>Colin and Rohini want to have a child and seek genetic counseling because they are concerned about their child having disease Z. Rohini is unaffected by disease Z but Colin is. If their first child is a son, order the following four mechanisms of disease Z inheritance in increasing likeliness of their son having disease Z.</p><br />
                <p>1) Hollandric</p>
                <p>2) Maternal effect</p>
                <p>3) X-linked recessive</p>
                <p>4) Autosomal dominant</p><br />
                <p>ANSWER: <span class="answer">2, 3, 4, 1</span></p>
            </div>
            <div slot="earth">
                <p>Order the following minerals in increasing order by their susceptibility to chemical weathering:</p><br />
                <p>1) Olivine</p>
                <p>2) Hematite</p>
                <p>3) Calcite</p>
                <p>4) Quartz</p><br />
                <p>ANSWER: <span class="answer">2, 4, 1, 3</span></p>
            </div>
            <div slot="chem">
                <p>Which of the following reagents would result in the formation of an alcohol when reacted with pentone in ethanol solution?</p><br />
                <p>W) NaBH₄</p>
                <p>X) H₂SO₄</p>
                <p>Y) KMnO₄</p>
                <p>Z) Methlyamine</p><br />
                <p>ANSWER: <span class="answer">W) NaBH₄</span></p>
            </div>
            <div slot="physics">
                <p>Consider a 1 kg mass at position x = 1. If the potential energy as a function of x is equal to -x<sup>3</sup> + 4x<sup>2</sup> - 5x + 2, what is the angular frequency of small oscillations around the point x = 1?</p><br />
                <p>ANSWER: <span class="answer">√<span style="border-top: 1px solid white; position: relative; top: 1.05px;">2</span></span></p>
            </div>
            <div slot="math">
                <p>Brian and Rishabh take turns playing Russian Roulette using a nerf revolver with 6 spaces for darts and one actual dart in it. However, Rishabh cheated using magic that makes himself half as likely as usual to pick the slot that has the dart in it. if Rishabh goes first, what is the probability that he dies on his second turn?</p><br />
                <p>ANSWER: <span class="answer"><sup>55</sup>⁄<sub>864</sub></span></p>
            </div>
        </SubjectMenu>
    </section>
    <a href='https://docs.google.com/document/d/1wYKWAL78MHUq8o7Xq5XZiCP5LirB9YQrTpYJhjPhLfI/edit?usp=sharing' target="_blank" rel="noreferrer"><h2 class="info">Rules</h2></a>
</main>


<style lang="scss">
    h1  {
        font-size: 180px;
        margin: .2em .0em 0 0;
        letter-spacing: .1em;

        @media (max-width: 900px) {
            font-size: 120px;
        }

        @media (max-width: 700px) {
            font-size: 100px;
        }

        @media (max-width: 550px) {
            font-size: 80px;
        }
        @media (max-width: 350px) {
            font-size: 60px;
        }
    }
    
    h2 {
        font-size: 50px;
        margin: 0 0 .3em 0;
        @media (max-width:700px) {
            font-size: 40px;
        }

        @media (max-width: 400px) {
            font-size: 32px;
        }
    }
    
    h3 {
       font-size: 40px;

       @media (max-width: 550px) {
           font-size: 32px;
       }
    }

    .info {
        margin: .5em;
    }

    #staff {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-evenly;
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
    
    .answer {
        display: inline-block;
        background-color: white;
        border-radius: 0.1em;
        padding: 0.1em 0.2em;
        height: 100%;
        cursor: default;

        &:hover {
            background-color: transparentize($color: white, $amount: 0.8);
        }
    }

    #hero {
        position: relative;
        padding: 0 5em;

        @media (max-width: 700px) {
            padding: 0 1em;
        }
    }

    main {
        margin: 0 5vw min(6em, 20vh);
    }

    p {
        font-size: 20px;
        margin: .1em 0;
        line-height: 1.3em;
    }

    .bubble {
        border-radius: 15px;
        background-color: var(--color-2);
        padding: 3em;
        color:white;
        margin: 2em 0;

        @media (max-width: 700px) {
            padding: 2em 1em;
        }

        a {
            color: #6a7ff6;
        }
    }

    a {
        color: blue;
    }
</style>