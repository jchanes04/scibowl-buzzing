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
    import type { Question } from "$lib/classes/Game";
    import {
        initChatMessages,
        clearChatMessages,
    } from "$lib/stores/chatMessages.svelte";
    import {
        initScoreboardSubscription,
        clearScoreboardSubscription,
    } from "$lib/stores/scoreboard.svelte";
    import gameIdStore from "$lib/stores/gameId.svelte";
    import {
        initMembersSubscription,
        clearMembersSubscription,
        myMemberStore,
    } from "$lib/stores/members.svelte";
    import { modalStore } from "$lib/stores/modal.svelte";
    import Confirm from "$lib/components/Confirm.svelte";
    import { scoreboardStore } from "$lib/stores/scoreboard.svelte";
    import { goto } from "$app/navigation";

    interface Props {
        data: PageServerData;
    }

    let { data }: Props = $props();
    let gameInfo = $derived(data.gameInfo);

    const socket = createSocket();

    // Initialize game store with question state (not member data - that comes from Convex)
    function initGameState() {
        gameStore.set(data.gameInfo);
        gameIdStore.set(data.gameInfo.id);
        initChatMessages(data.chatHistory);
        initScoreboardSubscription(data.gameInfo.id);
        initMembersSubscription(data.gameInfo.id, data.myMemberId);
    }

    // Initialize game state synchronously for SSR
    initGameState();

    // Initialize all subscriptions
    $effect(() => {
        const _deps = [data.gameInfo, data.myMemberId];
        untrack(() => {
            initGameState();
        });
    });

    // Cleanup on unmount
    onDestroy(() => {
        modalStore.hide();
        clearChatMessages();
        clearScoreboardSubscription();
        clearMembersSubscription();
        gameIdStore.clear();
    });

    // Watch isActive via Convex subscription
    $effect(() => {
        if (scoreboardStore.isActive === false) {
            modalStore.show({
                title: "Game Inactive",
                message:
                    "This game has been paused due to inactivity. You can reopen it to continue playing, or leave to return to the home page.",
                confirmText: "Reopen Game",
                cancelText: "Leave Game",
                confirmCallback: () => socket.emit("reopenGame"),
                cancelCallback: () => {
                    goto("/");
                    socket.disconnect();
                },
            });
        } else if (
            scoreboardStore.isActive === true &&
            modalStore.current &&
            "title" in modalStore.current &&
            modalStore.current.title === "Game Inactive"
        ) {
            modalStore.hide();
        }
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
            gameStore.value?.state.currentBuzzer?.id ===
                myMemberStore.value?.id,
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
