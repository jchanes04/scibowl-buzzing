<script lang="ts">
    import { useQuery } from "convex-svelte";
    import { api } from "../../../../../convex/_generated/api";
    import MemberList from "../../MemberList.svelte";
    import Chatbox from "../../Chatbox.svelte";
    import TopBar from "$lib/components/TopBar.svelte";
    import Timer from "../../Timer.svelte";
    import PlayerControls from "../PlayerControls.svelte";
    import ReaderControls from "../ReaderControls.svelte";
    import Scoreboard from "../../Scoreboard.svelte";

    import type { PageServerData } from "./$types";
    import { browser } from "$app/environment";

    import Debugger from "$lib/classes/Debugger";
    import { setContext } from "svelte";
    import gameStore from "$lib/stores/game";
    import type { ClientTeamData } from "$lib/classes/client/ClientTeam";
    import type { ClientPlayerData } from "$lib/classes/client/ClientPlayer";
    import { page } from "$app/state";
    import { createSocket } from "$lib/socket.svelte";
    import { beforeNavigate } from "$app/navigation";
    import type { ClientModeratorData } from "$lib/classes/client/ClientModerator";

    interface Props {
        data: PageServerData;
    }

    let { data }: Props = $props();
    let gameInfo = $derived(data.gameInfo);
    let memberId = $derived(data.myMemberId);

    $effect(() => {
        sessionStorage.setItem("memberId", memberId ?? "");
    });

    const socket = createSocket();

    const rawTeams = useQuery(api.teams.getByGameId, { gameId : page.params.id ?? "" });
    const teams : ClientTeamData[] = $derived(
        (rawTeams.data ?? []).map(team => ({
            id: team.externalId,
            name: team.name,
            type: team.type
        }))
    );

    const rawPlayers = useQuery(api.players.getByGameId, { gameId : page.params.id ?? "" });
    const players : ClientPlayerData[] = $derived(
        (rawPlayers.data ?? []).map(player => ({
            name: player.name,
            id: player.externalId,
            connected: player.connected,
            type: "player",
            team: teams.find(team => team.id === player.teamId)?.id ?? null,
            isCaptain: player.isCaptain ?? false
        }))
    );
    let myPlayer = $derived(players.find(player => player.id === memberId));

    const rawModerators = useQuery(api.moderators.getByGameId, { gameId : page.params.id ?? "" });
    const moderators : ClientModeratorData[] = $derived(
        (rawModerators.data ?? []).map(mod => ({
            name: mod.name,
            id: mod.externalId,
            connected: mod.connected,
            type: "moderator"
        }))
    );
    let myModerator = $derived(moderators.find(mod => mod.id === memberId));

    function syncStores() {
        // currentBuzzer is now { id: string, teamId: string } | null
        // Extract just the id for the store
        let currentBuzzerStore: string | null = null;
        if (data.currentGameState.currentBuzzer) {
            currentBuzzerStore = data.currentGameState.currentBuzzer.id ?? null;
        }

        // currentQuestion already has teamId (not team object)
        let currentQuestion = data.currentGameState.currentQuestion;

        $gameStore = {
            ...data.gameInfo,
            state: {
                questionState: data.currentGameState.questionState,
                currentBuzzer: currentBuzzerStore,
                currentQuestion: currentQuestion,
                buzzingEnabled: data.currentGameState.questionState === "open",
                buzzedTeamIds: data.currentGameState.buzzedTeamIds,
            } as any,
            scores: data.scores,
        };
    }

    // Initialize stores synchronously for SSR and first client render
    syncStores();

    // Keep stores in sync on the client when data props change
    $effect.pre(() => {
        syncStores();
    });

    // svelte-ignore state_referenced_locally
    const debug = browser
        ? new Debugger(
              data.gameInfo.id,
              data.gameInfo.name,
              memberId ?? "",
              myPlayer?.name ?? "",
              socket,
          )
        : null;
    setContext("debug", debug);

    let buzzed = $derived(
        $gameStore?.state.questionState === "buzzed" &&
        $gameStore?.state.currentBuzzer === memberId,
    );

    beforeNavigate(() => {
        socket.disconnect();
    });
</script>

<svelte:head>
    <title>{gameInfo.name}</title>
</svelte:head>

<main class:buzzed>
    <TopBar gameName={gameInfo.name} joinCode={gameInfo.joinCode}>
        <Timer onend={() => gameStore.disableBuzzing()} />
    </TopBar>
    <MemberList />
    <Scoreboard />
    <Chatbox />

    {#if myModerator}
        <ReaderControls />
    {:else}
        <PlayerControls />
    {/if}

    <button
        onclick={() => debug?.openDebugLog()}
        style="position: fixed; right: 10px; bottom: 10px; cursor: pointer; background:grey; border-radius:1em; padding:.2em;"
        >Open Debug Log</button
    >
</main>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    @keyframes pulse {
        0% {
            box-shadow: inset 0 0 30px 10px $primary;
        }
        50% {
            box-shadow: inset 0 0 50px 20px $primary;
        }
        100% {
            box-shadow: inset 0 0 30px 10px $primary;
        }
    }

    main {
        position: relative;
        display: grid;
        grid-template-columns: 0.1fr 1fr 1fr 1fr 0.1fr;
        grid-template-rows: max(10vh, 80px) auto auto;
        grid-template-areas:
            "top-bar top-bar top-bar top-bar top-bar"
            ". member-list scoreboard chat-box ."
            ". control-panel control-panel control-panel .";
        column-gap: 1em;
        row-gap: 1em;
        justify-self: stretch;

        &.buzzed::before {
            content: "";
            position: absolute;
            top: max(10vh, 80px);
            left: 0;
            right: 0;
            bottom: -1em;
            box-shadow: inset 0 0 30px 10px $primary;
            pointer-events: none;
            z-index: 1;
            animation: pulse 2s infinite;
        }

        @media (max-width: 800px) {
            grid-template-columns: 0.1fr 1fr 1fr 0.1fr;
            grid-template-rows: max(10vh, 80px) auto auto auto;
            grid-template-areas:
                "top-bar top-bar top-bar top-bar"
                ". chat-box chat-box ."
                ". control-panel control-panel ."
                ". member-list scoreboard .";

            &.buzzed::before {
                top: max(10vh, 80px);
            }
        }

        @media (max-width: 500px) {
            grid-template-columns: 0.05fr 1fr.05fr;
            grid-template-rows: max(10vh, 80px) auto auto auto auto;
            grid-template-areas:
                "top-bar top-bar top-bar"
                ". chat-box ."
                ". control-panel ."
                ". scoreboard ."
                ". member-list .";

            &.buzzed::before {
                top: max(10vh, 80px);
            }
        }
    }
</style>
