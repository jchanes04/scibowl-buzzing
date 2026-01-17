<script lang="ts">
    import ControlSection from "./ControlSection.svelte";
    import { gameClockStore } from "$lib/stores/timer.svelte";
    import TimeEntry from "./TimeEntry.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import playSvg from "$lib/icons/play.svg?raw";
    import pausePlaySvg from "$lib/icons/pause-play.svg?raw";
    import stopSvg from "$lib/icons/stop.svg?raw";
    import { useConvexClient } from "convex-svelte";
    import { api } from "../../../../convex/_generated/api";
    import gameIdStore from "$lib/stores/gameId.svelte";
    import getSocket from "$lib/socket.svelte";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import Confirm from "$lib/components/Confirm.svelte";

    const socket = getSocket();
    const convex = useConvexClient();

    type ModalStore = Writable<{
        component: any;
        props: Record<string, unknown>;
    } | null>;
    const modalStore: ModalStore = getContext("modalStore");

    let gameClockTime: number = $state(0);
    let startGameClockDisabled = $state(false);
    let pauseGameClockDisabled = $state(false);
    let stopGameClockDisabled = $state(false);

    function startGameClock() {
        startGameClockDisabled = true;
        setTimeout(() => (startGameClockDisabled = false), 1000);

        const minutes = Math.floor(gameClockTime / 60);
        const seconds = gameClockTime % 60;
        const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

        socket.emit("startGameClock", gameClockTime);

        // Add chat message via socket
        const gId = gameIdStore.value;
        if (gId) {
            socket.emit("addChatMessage", {
                type: "notification",
                text: `${timeDisplay} game clock started`,
            });
        }

        gameClockTime = 0;
    }

    function pauseGameClock() {
        pauseGameClockDisabled = true;
        setTimeout(() => (pauseGameClockDisabled = false), 1000);

        socket.emit("pauseGameClock");

        // Add chat message via socket
        const gId = gameIdStore.value;
        if (gId) {
            const messageText = gameClockStore.live
                ? "Game clock paused"
                : "Game clock resumed";
            socket.emit("addChatMessage", {
                type: "notification",
                text: messageText,
            });
        }
    }

    function stopGameClock() {
        stopGameClockDisabled = true;
        setTimeout(() => (stopGameClockDisabled = false), 1000);

        socket.emit("stopGameClock");

        // Add chat message via socket
        const gId = gameIdStore.value;
        if (gId) {
            socket.emit("addChatMessage", {
                type: "notification",
                text: "Game clock stopped",
            });
        }
    }

    function endGame() {
        modalStore.set({
            component: Confirm,
            props: {
                title: "End Game",
                message: "Are you sure you want to end the game?",
                cancelCallback: () => {
                    modalStore.set(null);
                },
                confirmCallback: () => {
                    socket.emit("endGame");
                    modalStore.set(null);
                },
            },
        });
    }
</script>

<ControlSection
    title="Game Clock"
    style="display: flex; flex-direction: column; align-items: center; gap: 1.5rem;"
>
    <div class="game-clock-wrapper">
        <TimeEntry bind:value={gameClockTime} />
    </div>
    <div class="game-control-buttons">
        <button
            disabled={startGameClockDisabled || gameClockTime === 0}
            onclick={startGameClock}
            class="icon-btn control-btn"
        >
            <Icon svg={playSvg} />
        </button>
        <button
            disabled={pauseGameClockDisabled || gameClockStore.value === 0}
            onclick={pauseGameClock}
            class="icon-btn control-btn"
        >
            <Icon svg={pausePlaySvg} />
        </button>
        <button
            disabled={stopGameClockDisabled ||
                (gameClockStore.value === 0 && !gameClockStore.ended)}
            onclick={stopGameClock}
            class="icon-btn control-btn"
        >
            <Icon svg={stopSvg} />
        </button>
    </div>

    <button onclick={endGame} id="endGame">End Game</button>
</ControlSection>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    .game-clock-wrapper {
        border: 3px solid $border-color;
        border-radius: 0.5em;
        padding: 1em;
        align-items: center;
        transition: border-color 0.2s ease;

        &:focus-within {
            border-color: $primary;
        }
    }

    .game-control-buttons {
        display: flex;
        gap: 1rem;
    }

    .control-btn {
        width: 4rem;
        height: 4rem;
        border-radius: 0.5em;
        font-size: 1.5rem;
    }

    #endGame {
        background: $red;
        width: 100%;
    }

    button {
        @extend %button;
        font-size: 1.25rem;
        padding: 0.5em 0.5em;
    }

    .icon-btn {
        padding: 0.75em;
        display: flex;
        align-items: center;
        justify-content: center;
        background: $primary;
        color: $text-light;
    }
</style>
