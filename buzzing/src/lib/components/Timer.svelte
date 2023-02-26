<script lang="ts" context="module">
    import { timerStore, gameClockStore } from "$lib/stores/timer"
</script>

<script lang="ts">
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher()

    timerStore.addEventListener?.("end", () => {
        dispatch("end")
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