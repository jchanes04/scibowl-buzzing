<script lang="ts">
    import type Debugger from "$lib/classes/Debugger";
    import buzzAudioStore from "$lib/stores/buzzAudio";
    import gameStore from "$lib/stores/game";
    import getSocket from "$lib/socket";
    import { timerStore, gameClockStore } from "$lib/stores/timer";
    import { getContext } from "svelte";
    import myMember from "$lib/stores/myMember";
    
    const socket = getSocket()
    const debug: Debugger = getContext('debug')

    function buzz() {
        socket.emit('buzz');
        $buzzAudioStore?.play()

        gameStore.buzz($myMember.team?.id || "")
        timerStore.pause()
        
        debug.addEvent('buzz', {})
    }

    function claimCaptain() {
        socket.emit('claimCaptain')
        debug.addEvent('claimCaptain', {})
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
        <br />
        <button on:click={claimCaptain}>Claim Captain</button>
    </div>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    .player-controls {
        grid-area: control-panel;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2em;
        box-sizing: border-box;
        border-radius: 1em;
        background: $background-1;
        padding: 2em;
    }

    button {
        @extend %button;

        border-radius: 0.5em;
        padding: 1em 2em;
    }

    #buzz {
        font-size: 36px;
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