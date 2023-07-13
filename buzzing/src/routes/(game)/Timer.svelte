<script lang="ts">
    import { browser } from "$app/environment";
    import { timerStore, gameClockStore } from "$lib/stores/timer"
    import gameStore from "$lib/stores/game"
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher()
    const fiveSecondAudio = browser ? new Audio('/five-second.mp3') : null

    timerStore.addEventListener?.("end", () => {
        dispatch("end")
    })

    function handleTimerUpdate() {
        if ($timerStore === 5 && $gameStore.state.currentQuestion?.bonus) {
            fiveSecondAudio?.play()
        }
    }

    $: $timerStore, handleTimerUpdate()
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