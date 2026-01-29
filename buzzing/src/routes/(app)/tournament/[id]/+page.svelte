<script lang="ts">
    import { untrack } from "svelte";
    import type { PageData } from "./$types";
    import {
        initTournamentSubscription,
        clearTournamentSubscription,
        tournamentStore,
    } from "$lib/stores/tournament.svelte";
    import {
        initBracketStore,
        clearBracketStore,
    } from "$lib/stores/bracket.svelte";
    import TournamentHeader from "./components/TournamentHeader.svelte";
    import TournamentSettings from "./components/TournamentSettings.svelte";
    import BracketSetup from "./components/BracketSetup.svelte";
    import BracketView from "./components/BracketView.svelte";
    import { onDestroy } from "svelte";

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    initTournamentSubscription(
        untrack(() => data.tournamentId),
        untrack(() => data.isOrganizer),
        untrack(() => data.initialTournament),
        untrack(() => data.userId),
    );
    initBracketStore();

    onDestroy(() => {
        clearTournamentSubscription();
        clearBracketStore();
    });

    let tournament = $derived(tournamentStore.value);
</script>

<svelte:head>
    <title>{tournament.name} - Tournament</title>
</svelte:head>

<main>
    <TournamentHeader />

    <BracketSetup />

    <BracketView />

    <TournamentSettings />
</main>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    main {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 1200px;
        margin: auto;
        justify-items: center;
        padding: 1rem;
    }
</style>
