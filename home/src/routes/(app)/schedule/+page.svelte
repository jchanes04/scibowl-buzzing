<script lang="ts">
    import Schedule from "$lib/components/Schedule.svelte"
</script>

<main>
    <section class="bubble">
        <h1>Schedule</h1>
        <p>
            Information about the schedule on tournament day will be released at a later date.
        </p>
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