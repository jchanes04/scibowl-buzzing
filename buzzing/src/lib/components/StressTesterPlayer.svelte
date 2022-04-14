<script lang="ts">
    import { browser } from "$app/env";
    import type Debugger from "$lib/classes/Debugger";
    import buzzAudioStore from "$lib/stores/buzzAudio";
    import chatMessagesStore from "$lib/stores/chatMessages";
    import gameInfoStore from "$lib/stores/gameInfo";
    import gameStateStore from "$lib/stores/gameState";
    import socketStore from "$lib/stores/socket";
    import timerStore from "$lib/stores/timer";
    import { getContext } from "svelte";
    const debug: Debugger = getContext('debug')

    function buzz() {
        $socketStore.emit('buzz');
        // $buzzAudioStore.play()

        $gameStateStore = ({
            questionState: 'buzzed',
            buzzingDisabled: true,
            buzzedTeamIDs: [...$gameStateStore.buzzedTeamIDs, $gameInfoStore.myTeam.id ]
        })
        $timerStore.pause()
        
        debug.addEvent('buzz', {})
        $chatMessagesStore = [...$chatMessagesStore, {
            type: 'buzz',
            text: 'You have buzzed'
        }]
    }

    if (browser) {
        setInterval(()=>{buzz()},5000)
    }
</script>

<svelte:body on:keydown={(e) => {
    const { code, keyCode } = e
    if ((code === "Space" || code === "Enter") && !$gameStateStore.buzzingDisabled) {
        buzz()
    } else if (code === null || code === undefined) {
        if ((keyCode === 32 || keyCode === 13) && !$gameStateStore.buzzingDisabled) {
            buzz()
        }
    }
}} />

<div>
    <button id="buzz" on:click={buzz} disabled={$gameStateStore.buzzingDisabled}>buzz</button>
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