
<svelte:head>
    <title>ESBOT Buzzing System</title>
</svelte:head>

<main>
    <section id="hero">
        <h1>Welcome to the ESBOT Buzzing System</h1>
        <div class="hero-actions">
            <a href='/create'>Create a Game</a>
            <a href='/join'>Join a Game</a>
        </div>
    </section>

    <section class='bubble'>
        <h2>Revolutionary Buzzing</h2>
        <p>
            Say goodbye to latency. ESBOT has developed a websocket-based buzzing system with ultra-low latency that will appease even the most competitive players.
            With integrated scoring, timing, and moderation tools, our system is perfect for all online Science Bowl gameplay.
            Experience the closest emulation of real, in-person Science Bowl.
        </p>
    </section>
</main>

<style lang="scss">
    @use '$styles/_global.scss' as *;


    main {
        max-width: 1000px;
        margin: 4rem auto;
        padding: 0 2rem;
    }

    h1 {
        font-size: 4.5rem;
        font-weight: 800;
        line-height: 1.1;
        margin-bottom: 2rem;
        color: $text;
    }
    
    .hero-actions {
        display: flex;
        gap: 1rem;
        margin-bottom: 4rem;

        a {
            @extend %button;
            text-decoration: none;
            background: $primary;
            font-size: 1.25rem;
            padding: 0.8rem 2rem;
        }

    }

    h2 {
        font-size: 2.5rem;
        font-weight: 800;
        margin-bottom: 1.5rem;
    }

    p {
        font-size: 1.25rem;
        line-height: 1.6;
        opacity: 0.9;
    }

    .bubble {
        border-radius: 2rem;
        border: 3px solid $border-color;
        background: $primary;
        padding: 4rem;
        color: $text-light;
        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    }

    @media (max-width: 768px) {
        h1 { font-size: 3rem; }
        .hero-actions { flex-direction: column; }
        .bubble { padding: 2rem; }
    }
</style>
