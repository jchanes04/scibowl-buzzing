<script lang="ts">
    import type Debugger from "$lib/classes/Debugger";
    import buzzAudioStore from "$lib/stores/buzzAudio";
    import gameStore from "$lib/stores/game";
    import socket from "$lib/socket";
    import timerStore from "$lib/stores/timer";
    import { getContext } from "svelte";
    import myMember from "$lib/stores/myMember";
    
    const debug: Debugger = getContext('debug')

    function buzz() {
        socket.emit('buzz');
        $buzzAudioStore?.play()

        gameStore.buzz($myMember.team?.id || "")
        $timerStore.pause()
        
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

<div>
    <button id="buzz" on:click={buzz} disabled={!$gameStore.state.buzzingEnabled}>Buzz</button>
</div>

<style>
    div {
        grid-area: control-panel;
        display: grid;
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
</style>