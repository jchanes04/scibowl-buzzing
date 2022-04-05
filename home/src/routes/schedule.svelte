<script lang="ts">
import Schedule from "$lib/components/Schedule.svelte";


</script>

<main>
    <section class="bubble">
        <h1>Schedule</h1>
        <p>
            The day will begin with an opening ceremony at <b>8:45 AM</b>. Round Robin matches will run from <b>9:05 to 1:10</b>.
            After Round Robin there will be a seeding round from <b>1:15 to 1:35</b> to determine the top 8 teams, who will enter Double Eliminations with no losses.
            There will be <b>40 minute</b> lunch break following the seeding round. Double Elimination rounds will begin at <b>2:20</b>, with awards and closing planned for <b>7:05</b>.
        </p>
        <br />
        <p>
            The goal of the seeding round is to reduce the number of concurrent Double Elimination rounds. The <b>top 2</b> teams from each Round Robin bracket will advance to the seeding round, which will consist of <b>10 tossup questions</b> read to each team <b>on their own</b>, similar to tiebreaker or online competition format.
            The top two teams from each bracket are determined first by <b>win/loss record</b> and next by the result of their <b>head-to-head match</b>. Any remaining ties will be broken by <b>seeding round performance</b> and then by <b>points per game</b>.  
        </p>
        <br />
        <p>
            The top team from each bracket is <b>guaranteed</b> to begin in the Double Elimination winners bracket, along with the <b>two</b> second-place teams who <b>performed best</b> during the seeding round. Double elimination seeds will be determined first by <b>win/loss</b> record and then by <b>seeding round performance</b>.
            The rest of the Double Eliminations will continue as normal.
        </p>
        <br />
        <p>All times are in EDT</p>
    </section>

    <Schedule />
</main>

<style lang="scss">
    main {
        margin: 0 5vw 10vh;
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
    }

    p {
        font-size: 20px;
        margin: .1em 0;
        line-height: 1.3em;
    }
</style>