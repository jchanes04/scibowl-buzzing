<script lang="ts">
    import { getContext } from "svelte";
    import type Debugger from "$lib/classes/Debugger";
    import type { Writable } from "svelte/store";
    import gameStore from "$lib/stores/game.svelte";
    import { scoreboardStore } from "$lib/stores/scoreboard.svelte";
    import getSocket from "$lib/socket.svelte";
    import { useConvexClient } from "convex-svelte";
    import ExpandedScoreboard from "$lib/components/ExpandedScoreboard.svelte";
    import GameClockControls from "./GameClockControls.svelte";
    import QuestionControls from "./QuestionControls.svelte";
    import ScoringControls from "./ScoringControls.svelte";

    import { modalStore } from "$lib/stores/modal.svelte";

    const socket = getSocket();
    const debug: Debugger = getContext("debug");
    const convex = useConvexClient();

    let scoreboardExpanded = $state(false);
</script>

<div id="buttons" class:scoreboard-expanded={scoreboardExpanded}>
    <div class="controls-grid">
        <QuestionControls />
        <ScoringControls bind:scoreboardExpanded />
        <GameClockControls />
    </div>

    {#if scoreboardExpanded}
        <div class="expanded-scoreboard-wrapper">
            <ExpandedScoreboard isModerator={true} />
        </div>
    {/if}
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    #buttons {
        padding: 1.5em;
        display: flex;
        flex-direction: column;
        gap: 1.5em;

        grid-area: control-panel;
        box-sizing: border-box;
        border-radius: 1em;
        background: $background-2;
        position: relative;
    }

    .controls-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5em;
        justify-content: center;
        align-items: start;
    }

    .expanded-scoreboard-wrapper {
        width: 100%;
        position: relative;
    }
</style>
