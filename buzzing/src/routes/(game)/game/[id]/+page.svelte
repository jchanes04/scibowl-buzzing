<script lang="ts">
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
    import gameStore, { type ClientGameData } from "$lib/stores/game.svelte";
    import { createSocket } from "$lib/socket.svelte";
    import { beforeNavigate } from "$app/navigation";
    import { untrack, onDestroy } from "svelte";
    import type { NewQuestionData } from "$lib/classes/Game";
    import { initChatSubscription, clearChatSubscription } from "$lib/stores/chatMessages.svelte";
    import { initScoreboardSubscription, clearScoreboardSubscription } from "$lib/stores/scoreboard.svelte";
    import gameIdStore from "$lib/stores/gameId.svelte";
    import {
        initMembersSubscription,
        clearMembersSubscription,
        useMembers,
        useTeams,
        setMembers,
        setTeams,
        myMemberStore
    } from "$lib/stores/members.svelte";

    interface Props {
        data: PageServerData;
    }

    let { data }: Props = $props();
    let gameInfo = $derived(data.gameInfo);

    const socket = createSocket();

    // Initialize game store with question state (not member data - that comes from Convex)
    function initGameState() {
        const serverQuestion = data.currentGameState.currentQuestion;
        const clientQuestion: NewQuestionData | null = serverQuestion
            ? serverQuestion.bonus
                ? {
                    bonus: true,
                    category: serverQuestion.category,
                    teamId: serverQuestion.teamId ?? "",
                    number: serverQuestion.number,
                    visual: serverQuestion.visual
                }
                : {
                    bonus: false,
                    category: serverQuestion.category,
                    number: serverQuestion.number
                }
            : null;

        const gameData: ClientGameData = {
            ...data.gameInfo,
            state: (data.currentGameState.questionState === "open" || data.currentGameState.questionState === "buzzed") && clientQuestion
                ? {
                    questionState: "open",
                    currentBuzzer: null,
                    currentQuestion: clientQuestion,
                    buzzingEnabled: true,
                    buzzedTeamIds: data.currentGameState.buzzedTeamIds,
                }
                : {
                    questionState: "idle",
                    currentBuzzer: null,
                    currentQuestion: null,
                    buzzingEnabled: false,
                    buzzedTeamIds: [],
                }
        };
        gameStore.set(gameData);
    }

    // Initialize game state synchronously for SSR
    initGameState();

    // Initialize all subscriptions
    $effect(() => {
        if (data.gameInfo.id && data.myMemberId) {
            gameIdStore.set(data.gameInfo.id);
            initChatSubscription(data.gameInfo.id, data.myMemberId);
            initScoreboardSubscription(data.gameInfo.id);
            initMembersSubscription(data.gameInfo.id, data.myMemberId);
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

    // Cleanup on unmount
    onDestroy(() => {
        clearChatSubscription();
        clearScoreboardSubscription();
        clearMembersSubscription();
        gameIdStore.clear();
    });

    // Update gameStore when question state changes (from socket events)
    $effect.pre(() => {
        const _deps = [data.gameInfo, data.currentGameState];
        untrack(() => {
            initGameState();
        });
    });

    // svelte-ignore state_referenced_locally
    const debug = browser
        ? new Debugger(
              data.gameInfo.id,
              data.gameInfo.name,
              myMemberStore.value,
              socket,
          )
        : null;
    setContext("debug", debug);

    let buzzed = $derived(
        gameStore.value?.state.questionState === "buzzed" &&
            gameStore.value?.state.currentBuzzer?.id === myMemberStore.value?.id,
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

    {#if myMemberStore.value.moderator}
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
