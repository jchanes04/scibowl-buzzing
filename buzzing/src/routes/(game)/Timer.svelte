<script lang="ts">
    import { browser } from "$app/environment";
    import { timerStore, gameClockStore } from "$lib/stores/timer";
    import gameStore from "$lib/stores/game";
    import { onDestroy } from "svelte";

    interface Props {
        onend?: () => void;
    }
    let { onend }: Props = $props();

    const fiveSecondAudio = browser ? new Audio("/five-second.mp3") : null;

    const onTimerEnd = () => {
        onend?.();
    };
    if (browser) timerStore.addEventListener?.("end", onTimerEnd);

    function handleTimerUpdate() {
        if ($timerStore === 5 && $gameStore.state.currentQuestion?.bonus) {
            fiveSecondAudio?.play();
        }
    }

    $effect(() => {
        $timerStore;
        handleTimerUpdate();
    });

    onDestroy(() => {
        timerStore.removeEventListener("end", onTimerEnd);
    });
</script>

<div>
    <h2>
        {Math.floor($timerStore / 60)
            .toString()
            .padStart(2, "0") +
            ":" +
            ($timerStore % 60).toString().padStart(2, "0")}
    </h2>
    <h3>
        {Math.floor($gameClockStore / 60)
            .toString()
            .padStart(2, "0") +
            ":" +
            ($gameClockStore % 60).toString().padStart(2, "0")}
    </h3>
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    div {
        display: flex;
        flex-direction: column;
    }

    h2 {
        margin: 0;
        text-align: right;
        font-size: 2.25rem;
        font-weight: 800;
        font-variant-numeric: tabular-nums;
        color: $primary;
    }

    h3 {
        margin: 0;
        text-align: right;
        font-size: 1.1rem;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        color: $gray-2;
    }
</style>
