<script lang="ts">
    import { run } from "svelte/legacy";

    import MemberList from "../../MemberList.svelte";
    import Chatbox from "../../Chatbox.svelte";
    import TopBar from "$lib/components/TopBar.svelte";
    import Timer from "../../Timer.svelte";
    import Scoreboard from "../../Scoreboard.svelte";

    import type { PageServerData } from "./$types";

    import gameStore from "$lib/stores/game";
    import { page } from "$app/stores";
    import { createSocket } from "$lib/socket.svelte";
    import { beforeNavigate } from "$app/navigation";
    import ExpandedScoreboard from "$lib/components/ExpandedScoreboard.svelte";

    interface Props {
        data: Required<PageServerData>;
    }

    let { data }: Props = $props();
    let gameInfo = $derived(data.gameInfo);
    let scores = $derived(data.scores);

    const socket = createSocket(true);

    $effect.pre(() => {
        $gameStore = {
            ...gameInfo,
            state: {
                questionState: "idle",
                currentBuzzer: null,
                currentQuestion: null,
                buzzingEnabled: false,
                buzzedTeamIds: [],
            },
            scores,
        };
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
