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
        clearMembersSubscription
    } from "$lib/stores/members.svelte";
    import { initScoreboardSubscription, clearScoreboardSubscription, scoreboardStore } from "$lib/stores/scoreboard.svelte";
    import { gameInactiveModal, showGameInactiveModal, hideGameInactiveModal } from "$lib/stores/gameInactiveModal.svelte"
    import GameInactiveModal from "$lib/components/GameInactiveModal.svelte"
    import { goto } from "$app/navigation";

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

    // Watch isActive via Convex subscription
    $effect(() => {
        if (scoreboardStore.isActive === false) {
            showGameInactiveModal(
                () => socket.emit('reopenGame'),
                () => {
                    goto('/')
                    socket.disconnect()
                }
            )
        } else if (scoreboardStore.isActive === true && gameInactiveModal.visible) {
            hideGameInactiveModal()
        }
    })

    // Cleanup
    onDestroy(() => {
        hideGameInactiveModal()
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

{#if gameInactiveModal.visible}
  <div class="modal-background"></div>
  <GameInactiveModal
    reopenCallback={gameInactiveModal.reopenCallback || (() => {})}
    leaveCallback={gameInactiveModal.leaveCallback || (() => {})}
  />
{/if}

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

    .modal-background {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 99;
    }
</style>
