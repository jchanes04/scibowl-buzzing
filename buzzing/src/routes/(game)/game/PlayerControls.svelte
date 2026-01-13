<script lang="ts">
    import type Debugger from "$lib/classes/Debugger";
    import gameStore from "$lib/stores/game.svelte";
    import getSocket from "$lib/socket.svelte";
    import { timerStore, gameClockStore } from "$lib/stores/timer.svelte";
    import { getContext } from "svelte";
    import myMemberStore from "$lib/stores/myMember.svelte";
    import visualBonusStore from "$lib/stores/visualBonus.svelte";
    import teamsStore from "$lib/stores/teams.svelte"
    import playersStore from "$lib/stores/players.svelte"
    import { browser } from "$app/environment";
    import ExpandedScoreboard from "$lib/components/ExpandedScoreboard.svelte";

    const socket = getSocket()
    const debug: Debugger = getContext('debug')
    const buzzAudio = browser ? new Audio('/buzz.mp3') : null

    let scoreboardExpanded = $state(false)

    function buzz() {
        socket.emit('buzz');
        buzzAudio?.play()

        const myMember = myMemberStore.value
        const player = playersStore.value[myMember.id]
        if (player) {
            gameStore.buzz(myMember.team?.id || "", player)
        }
        timerStore.pause()

        debug.addEvent('buzz', {})
    }

    function claimCaptain() {
        socket.emit('claimCaptain')
        debug.addEvent('claimCaptain', {})
    }

    function openVisual() {
        if (!visualBonus.url) return

        const newWindow = window.open("", "VisualBonus", "width=800,height=600")
        if (!newWindow) return

        visualBonusStore.value = {
            url: visualBonus.url,
            window: newWindow
        }
        const img = new Image()
        img.src = visualBonus.url
        newWindow.document.body.innerHTML =
            `<style>img { width: 100%; }</style><div>${img.outerHTML}</div>`
    }

    let visualBonus = $derived(visualBonusStore.value)
    let claimCaptainDisabled = $derived(teamsStore.value[myMemberStore.value.team?.id || ""]?.captainId === myMemberStore.value.id)
    let visualBonusEnabled = $derived(gameStore.value.state.questionState === "open"
            && gameStore.value.state.currentQuestion.bonus
            && gameStore.value.state.currentQuestion.visual
            && !!visualBonus.url)
</script>

<svelte:body onkeydown={(e) => {
    const { code, keyCode } = e
    if ((code === "Space" || code === "Enter") && gameStore.value.state.buzzingEnabled) {
        e.preventDefault()
        buzz()
    } else if (code === null || code === undefined) {
        if ((keyCode === 32 || keyCode === 13) && gameStore.value.state.buzzingEnabled) {
            e.preventDefault()
            buzz()
        }
    }
}} />

<div class="player-controls" class:scoreboard-expanded={scoreboardExpanded}>
    <div class="controls-element">
        <button id="buzz" onclick={buzz} disabled={!gameStore.value.state.buzzingEnabled}>Buzz</button>
        <div class="timer-wrapper">
            <h2>{Math.floor(timerStore.value / 60).toString().padStart(2, "0") + ":" + (timerStore.value % 60).toString().padStart(2, "0")}</h2>
            <h3>{Math.floor(gameClockStore.value / 60).toString().padStart(2, "0") + ":" + (gameClockStore.value % 60).toString().padStart(2, "0")}</h3>
            <br />
            <button onclick={claimCaptain} disabled={claimCaptainDisabled}>Claim Captain</button>
            <br />
            <br />
            <button onclick={() => scoreboardExpanded = !scoreboardExpanded}>
                {#if scoreboardExpanded}
                    Collapse Scoreboard
                {:else}
                    Expand Scoreboard
                {/if}
            </button>
            {#if visualBonusEnabled}
                <br />
                <br />
                <button onclick={openVisual}>Open Visual Bonus</button>
            {/if}
        </div>
    </div>

    {#if scoreboardExpanded}
        <ExpandedScoreboard isModerator={false} />
    {/if}
</div>



<style lang="scss">
    @use '$styles/_global.scss' as *;

    .player-controls {
        grid-area: control-panel;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3em;
        box-sizing: border-box;
        
        position: relative;
        
    }

    .controls-element {
        box-shadow: $shadow;
        border: 3px solid $border-color;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3em;
        position: relative;
        width: 100%;
        background: $background-1;
        border-radius: 1.5em;
        padding: 3em 0;
    }

    button {
        @extend %button;
        padding: 0.75em 1.5em;
        font-size: 1rem;
    }

    #buzz {
        font-size: 3rem;
        padding: 1.5em 2.5em;
        border-radius: 1em;
        background: $primary;
        box-shadow: 0 10px 15px -3px rgba($primary-rgb, 0.3), 0 4px 6px -2px rgba($primary-rgb, 0.05);
        
        &:disabled {
            background: $gray-1;
            box-shadow: none;
            color: $gray-2;
        }

        &:active:not(:disabled) {
            transform: #{"scale(0.95)"};
        }
    }

    .timer-wrapper {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.5em;
    }

    h2 {
        font-size: 3.5rem;
        font-weight: 800;
        margin: 0;
        color: $primary;
        font-variant-numeric: tabular-nums;
    }

    h3 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
        color: $gray-2;
        font-variant-numeric: tabular-nums;
    }
</style>