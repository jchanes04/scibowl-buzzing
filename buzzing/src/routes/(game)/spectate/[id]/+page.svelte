<script lang="ts">
    import { run } from "svelte/legacy";

    import MemberList from "../../MemberList.svelte";
    import Chatbox from "../../Chatbox.svelte";
    import TopBar from "$lib/components/TopBar.svelte";
    import Timer from "../../Timer.svelte";
    import Scoreboard from "../../Scoreboard.svelte";

    import type { PageServerData } from "./$types";

    import gameStore, { type ClientGameData } from "$lib/stores/game.svelte";
    import scoreboard from "$lib/stores/scoreboard.svelte";
    // Removed store imports - spectators get data from Convex but don't participate
    import { page } from "$app/stores";
    import { createSocket } from "$lib/socket.svelte";
    import { beforeNavigate } from "$app/navigation";
    import ExpandedScoreboard from "$lib/components/ExpandedScoreboard.svelte";

    interface Props {
        data: Required<PageServerData>;
    }

    let { data }: Props = $props();
    let gameInfo = $derived(data.gameInfo);
    let teamList = $derived(data.teamList);
    let moderatorList = $derived(data.moderatorList);
    let playerList = $derived(data.playerList);
    let scores = $derived(data.scores);

    const socket = createSocket(true);

    $effect.pre(() => {
        const gameData: ClientGameData = {
            ...gameInfo,
            times: {
                tossup: gameInfo.times.tossup as [number, number],
                bonus: gameInfo.times.bonus as [number, number],
                visual: gameInfo.times.visual as [number, number]
            },
            state: {
                questionState: "idle",
                currentBuzzer: null,
                currentQuestion: null,
                buzzingEnabled: false,
                buzzedTeamIds: [],
            },
        };
        gameStore.set(gameData);
        scoreboard.setScores(scores);

        // Spectators don't participate in the game, so stores remain empty
        // They can still see the scoreboard and chat
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
