<script lang="ts">
    import Schedule from "$lib/components/Schedule.svelte"
</script>

<main>
    <section class="bubble">
        <h1>Schedule</h1>
        <p>
            In order to prevent delays, the times listed here will be kept to as closely as possible.
            We are not building transition times into this schedule, but due to our game clock policy, rounds should finish well before the listed times.
            All rounds <b>will</b> begin reading questions at most 5 minutes after the listed start time, so participants should use all the time that they have to join their next match and prepare.
            All times are listed in EDT.
        </p>
        <Schedule />
    </section>
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