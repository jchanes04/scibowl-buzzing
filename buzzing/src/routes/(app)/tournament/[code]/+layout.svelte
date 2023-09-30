<script lang="ts">
    import type { NamedScores } from "$lib/functions/scoreboard";
    import type { LayoutData } from "./$types";
    import { setContext } from "svelte";
    import { writable } from "svelte/store";

    export let data: LayoutData
    let { games, code, name } = data
    $: ({ games, code, name } = data)

    function getTeamNames(scores: NamedScores) {
        const teamNames = new Set<string>()
        for (const row of Object.values(scores)) {
            if (row.bonus?.teamName) {
                teamNames.add(row.bonus.teamName)
            }
        }
        return Array.from(teamNames)
    }

    const pointValues = {
        tossup: 4,
        bonus: 10,
        penalty: -4
    }

    function sumQuestionScores(teamName: string, scores: NamedScores) {
        return Object.values(scores).reduce((acc, q) => {
            if (q.tossup[teamName]?.scoreType === "correct") {
                acc += pointValues.tossup 
            } else if (q.tossup[teamName]?.scoreType === "penalty") {
                acc += pointValues.penalty
            }

            if (q.bonus?.teamName === teamName && q.bonus?.correct) {
                acc += pointValues.bonus
            }
            return acc
        }, 0)
    }

    const modalStore = writable<{
        component: ConstructorOfATypedSvelteComponent,
        props: Record<string, unknown>
    } | null>(null)
    setContext('modalStore', modalStore)
</script>

<svelte:head>
    <title>Tournament Manager</title>
</svelte:head>

<main>
    <div style:grid-column="span 2">
        <h1>{name}</h1>
        <span>{code}</span>
    </div>
    <div>
        <a href="/tournament/{code}/stats" class="stats-link">Statistics</a>
        <div class="games">
            {#each games as g}
                <a href="/tournament/{code}/{g.gameId}">
                    <div class="game-card">
                        <span class="game-name">{g.name}</span>
                        <br />
                        <ul>
                            {#each getTeamNames(g.scores) as team}
                                <li>{team}: {sumQuestionScores(team, g.scores)}</li>
                            {/each}
                        </ul>
                    </div>
                </a>
            {/each}
        </div>
    </div>
    <div class="game-scores">
        <slot></slot>
    </div>
</main>
{#if $modalStore}
    <div class="modal-background" />
    <svelte:component this={$modalStore.component} {...$modalStore.props} />
{/if}


<style lang="scss">
    @use "$styles/_global.scss" as *;

    main {
        display: grid;
        grid-template-columns: 300px 1fr;
        padding: 2em;
        gap: 2em;
    }

    .games {
        display: flex;
        flex-direction: column;
        height: max(70vh, 400px);
        overflow: auto;
        margin-top: 1em;

        ul {
            list-style: none;
            margin: 0;
        }

        .game-name {
            font-size: 18px;
        }
    }

    .stats-link {
        font-size: 1.3em;
    }

    .game-card {
        padding: 0.5em 1em;

        &:hover {
            background-color: rgba(45, 45, 45, 0.15);
        }
    }

    a {
        color: $blue;
    }

    .modal-background {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 100vw;
        background-color: rgba(0, 0, 0, 0.3);
    }
</style>