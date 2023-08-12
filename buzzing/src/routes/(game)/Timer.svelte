<script lang="ts">
    import { browser } from "$app/environment";
    import { timerStore, gameClockStore } from "$lib/stores/timer"
    import gameStore from "$lib/stores/game"
    import { createEventDispatcher, onDestroy } from "svelte";

    const dispatch = createEventDispatcher()
    const fiveSecondAudio = browser ? new Audio('/five-second.mp3') : null

    const onTimerEnd = () => {
        dispatch("end")
    }
    if (browser) timerStore.addEventListener?.("end", onTimerEnd)

    function handleTimerUpdate() {
        if ($timerStore === 5 && $gameStore.state.currentQuestion?.bonus) {
            fiveSecondAudio?.play()
        }
    }

    $: $timerStore, handleTimerUpdate()

    onDestroy(() => {
        timerStore.removeEventListener("end", onTimerEnd)
    })
</script>

<div>
    <h2>{Math.floor($timerStore / 60).toString().padStart(2, "0") + ":" + ($timerStore % 60).toString().padStart(2, "0")}</h2>
    <h3>{Math.floor($gameClockStore / 60).toString().padStart(2, "0") + ":" + ($gameClockStore % 60).toString().padStart(2, "0")}</h3>
</div>

<style lang="scss">
    div {
        display: flex;
        flex-direction: column;
    }

    h3 {
        margin: 0;
        text-align: right;
        font-size: 18px;
    }

    h2 {
        margin: 0;
        text-align: right;
        font-size: 32px;
    }
</style>