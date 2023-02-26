<script lang="ts">
    import type Debugger from "$lib/classes/Debugger";
    import buzzAudioStore from "$lib/stores/buzzAudio";
    import gameStore from "$lib/stores/game";
    import socket from "$lib/socket";
    import { timerStore, gameClockStore } from "$lib/stores/timer";
    import { getContext } from "svelte";
    import myMember from "$lib/stores/myMember";
    
    const debug: Debugger = getContext('debug')

    function buzz() {
        socket.emit('buzz');
        $buzzAudioStore?.play()

        gameStore.buzz($myMember.team?.id || "")
        timerStore.pause()
        
        debug.addEvent('buzz', {})
    }
</script>

<svelte:body on:keydown={(e) => {
    const { code, keyCode } = e
    if ((code === "Space" || code === "Enter") && $gameStore.state.buzzingEnabled) {
        e.preventDefault()
        buzz()
    } else if (code === null || code === undefined) {
        if ((keyCode === 32 || keyCode === 13) && $gameStore.state.buzzingEnabled) {
            e.preventDefault()
            buzz()
        }
    }
}} />

<div class="player-controls">
    <button id="buzz" on:click={buzz} disabled={!$gameStore.state.buzzingEnabled}>Buzz</button>
    <div class="timer-wrapper">
        <h2>{Math.floor($timerStore / 60).toString().padStart(2, "0") + ":" + ($timerStore % 60).toString().padStart(2, "0")}</h2>
        <h3>{Math.floor($gameClockStore / 60).toString().padStart(2, "0") + ":" + ($gameClockStore % 60).toString().padStart(2, "0")}</h3>
    </div>
</div>

<style>
    .player-controls {
        grid-area: control-panel;
        display: grid;
        grid-template-columns: auto auto;
        grid-template-rows: 1fr;
        gap: 2em;
        place-content: center;
        box-sizing: border-box;
        border-radius: 1em;
        background: #EEE;
        padding: 2em;
    }

    button {
        background: var(--green);
        border: 3px solid var(--blue);
        border-radius: 0.5em;
        font-size: 36px;
        font-weight: 600;
        padding: 1em 2em;
        cursor: pointer;
    }

    button:disabled {
        color: #333;
        background: var(--green-dull);
        border-color: var(--blue-dull);
        cursor: default;
    }

    h2 {
        font-size: 48px;
        margin: 0;
    }

    h3 {
        font-size: 32px;
        margin: 0;
    }
</style>