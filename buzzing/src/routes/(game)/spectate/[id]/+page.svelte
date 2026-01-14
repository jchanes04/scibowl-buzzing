<script lang="ts">
    import MemberList from "../../MemberList.svelte";
    import Chatbox from "../../Chatbox.svelte";
    import TopBar from "$lib/components/TopBar.svelte";
    import Timer from "../../Timer.svelte";

    import type { PageServerData } from "./$types";
    import { onDestroy } from "svelte";

    import gameStore, { type ClientGameData } from "$lib/stores/game.svelte";
    import scoreboard from "$lib/stores/scoreboard.svelte";
    import { createSocket } from "$lib/socket.svelte";
    import { beforeNavigate } from "$app/navigation";
    import ExpandedScoreboard from "$lib/components/ExpandedScoreboard.svelte";
    import gameIdStore from "$lib/stores/gameId.svelte";
    import {
        initMembersSubscription,
        clearMembersSubscription,
        useMembers,
        useTeams,
        setMembers,
        setTeams
    } from "$lib/stores/members.svelte";
    import { initScoreboardSubscription, clearScoreboardSubscription } from "$lib/stores/scoreboard.svelte";

    interface Props {
        data: Required<PageServerData>;
    }

    let { data }: Props = $props();
    let gameInfo = $derived(data.gameInfo);

    const socket = createSocket(true);

    // Initialize game store
    $effect.pre(() => {
        const gameData: ClientGameData = {
            ...gameInfo,
            state: {
                questionState: "idle",
                currentBuzzer: null,
                currentQuestion: null,
                buzzingEnabled: false,
                buzzedTeamIds: [],
            },
        };
        gameStore.set(gameData);
    });

    // Initialize subscriptions (spectators use empty memberId)
    $effect(() => {
        if (data.gameInfo.id) {
            gameIdStore.set(data.gameInfo.id);
            initMembersSubscription(data.gameInfo.id, "");
            initScoreboardSubscription(data.gameInfo.id);
        }
    });

    // Get Convex queries for members and teams
    const membersQuery = useMembers();
    const teamsQuery = useTeams();

    // Update stores from Convex queries
    $effect(() => {
        const members = membersQuery.data;
        const teams = teamsQuery.data;
        if (members) {
            setMembers(members);
        }
        if (teams) {
            setTeams(teams);
        }
    });

    // Cleanup
    onDestroy(() => {
        clearMembersSubscription();
        clearScoreboardSubscription();
        gameIdStore.clear();
    });

    beforeNavigate(() => {
        socket.disconnect();
    });
</script>

<svelte:head>
    <title>{gameInfo.name}</title>
</svelte:head>

<main>
    <TopBar gameName={gameInfo.name} joinCode="X" spectator={true}>
        <Timer />
    </TopBar>
    <MemberList />
    <ExpandedScoreboard isModerator={false} showTotalInHeader={true} />
    <Chatbox />
</main>

<style lang="scss">
    main {
        display: grid;
        grid-template-columns: 0.1fr 1fr 1fr 0.1fr;
        grid-template-rows: max(10vh, 80px) auto;
        grid-template-areas:
            "top-bar top-bar top-bar top-bar"
            ". member-list chat-box ."
            ". scoreboard scoreboard .";
        column-gap: 1em;
        row-gap: 1em;
        justify-self: stretch;

        @media (max-width: 500px) {
            grid-template-columns: 0.05fr 1fr.05fr;
            grid-template-rows: max(10vh, 80px) auto auto auto;
            grid-template-areas:
                "top-bar top-bar top-bar"
                ". chat-box ."
                ". scoreboard ."
                ". member-list .";
        }
    }
</style>
