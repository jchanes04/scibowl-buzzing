<script lang="ts">
    import ControlSection from "./ControlSection.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import stopSvg from "$lib/icons/stop.svg?raw";
    import {
        moderatorsStore,
        playersStore,
        teamsStore,
    } from "$lib/stores/members.svelte";
    import gameStore from "$lib/stores/game.svelte";
    import { scoreboardStore } from "$lib/stores/scoreboard.svelte";
    import { timerStore } from "$lib/stores/timer.svelte";
    import getSocket from "$lib/socket.svelte";
    import { useConvexClient } from "convex-svelte";
    import { api } from "../../../../convex/_generated/api";
    import gameIdStore from "$lib/stores/gameId.svelte";
    import type { Writable } from "svelte/store";
    import { getContext } from "svelte";
    import type Debugger from "$lib/classes/Debugger";

    const socket = getSocket();
    const debug: Debugger = getContext("debug");
    const convex = useConvexClient();

    let startTimerDisabled = $state(false);
    function startTimer() {
        startTimerDisabled = true;
        setTimeout(() => (startTimerDisabled = false), 500);

        socket.emit("startTimer");
        debug.addEvent("startTimer", {});
    }
    function stopTimer() {
        timerStore.stop();

        socket.emit("stopTimer");
    }

    interface Props {
        scoreboardExpanded: boolean;
    }

    let { scoreboardExpanded = $bindable(false) }: Props = $props();

    let scoringEnabled = $derived(
        gameStore.value.state.questionState === "buzzed" ||
            gameStore.value.state.currentQuestion?.bonus,
    );
    function scoreQuestion(selectedScore: "correct" | "incorrect" | "penalty") {
        // Call Convex mutation first
        const gId = gameIdStore.value;
        const currentQuestion = gameStore.value.state.currentQuestion;
        const currentBuzzer = gameStore.value.state.currentBuzzer;

        // Convex mutations
        if (gId && currentQuestion) {
            const number = currentQuestion.number;
            const category = currentQuestion.category;

            if (currentQuestion.bonus) {
                const teamId = (currentQuestion as any).teamId;
                if (!teamId) return;

                if (selectedScore === "correct") {
                    convex.mutation(api.games.correctBonus, {
                        gameId: gId,
                        number,
                        teamId,
                        category,
                        playerList: Object.values(playersStore.value),
                        teamList: Object.values(teamsStore.value),
                    });
                } else {
                    convex.mutation(api.games.incorrectBonus, {
                        gameId: gId,
                        number,
                        teamId,
                        category,
                        playerList: Object.values(playersStore.value),
                        teamList: Object.values(teamsStore.value),
                    });
                }
            } else {
                if (!currentBuzzer) return;
                const playerId = currentBuzzer.id;
                const teamId = currentBuzzer.teamId;
                if (!teamId) return;

                if (selectedScore === "correct") {
                    convex.mutation(api.games.correctTossup, {
                        gameId: gId,
                        number,
                        playerId,
                        teamId,
                        category,
                        playerList: Object.values(playersStore.value),
                        teamList: Object.values(teamsStore.value),
                    });
                } else if (selectedScore === "incorrect") {
                    convex.mutation(api.games.incorrectTossup, {
                        gameId: gId,
                        number,
                        playerId,
                        teamId,
                        category,
                        playerList: Object.values(playersStore.value),
                        teamList: Object.values(teamsStore.value),
                    });
                } else if (selectedScore === "penalty") {
                    convex.mutation(api.games.penalty, {
                        gameId: gId,
                        number,
                        playerId,
                        teamId,
                        category,
                        playerList: Object.values(playersStore.value),
                        teamList: Object.values(teamsStore.value),
                    });
                }
            }
        }

        socket.emit("scoreQuestion", selectedScore);

        // Add chat message via socket
        if (gId) {
            const category =
                gameStore.value.state.currentQuestion?.category || "";
            const categoryDisplay = category
                ? (category[0] || "").toUpperCase() + category.slice(1)
                : "";

            let messageText = "";
            let messageType: "success" | "warning" = "success";

            if (selectedScore === "correct") {
                messageText = `Correct answer${categoryDisplay ? ` (${categoryDisplay})` : ""}`;
                messageType = "success";
            } else if (selectedScore === "incorrect") {
                messageText = "Incorrect answer";
                messageType = "warning";
            } else if (selectedScore === "penalty") {
                messageText = "Penalty applied";
                messageType = "warning";
            }

            socket.emit("addChatMessage", {
                type: messageType,
                text: messageText,
            });
        }

        // Note: questionNumber and teamSelectValue updates are handled in QuestionControls

        debug.addEvent("scoreQuestion", { selectedScore });
    }

    function markDead() {
        // Call Convex mutation first
        const gId = gameIdStore.value;
        const currentQuestion = gameStore.value.state.currentQuestion;

        if (gId && currentQuestion) {
            convex.mutation(api.games.dead, {
                gameId: gId,
                number: currentQuestion.number,
                category: currentQuestion.category,
                playerList: Object.values(playersStore.value),
                teamList: Object.values(teamsStore.value),
            });
        }

        socket.emit("markDead");

        // Add chat message via socket
        if (gId) {
            socket.emit("addChatMessage", {
                type: "notification",
                text: "Question marked dead",
            });
        }

        debug.addEvent("markDead", {});
    }
</script>

<ControlSection
    title="Scoring"
    style="display: flex; flex-direction: column; gap: 1rem;"
>
    <div style="width: 100%; display: flex; gap: 0.5rem;">
        <button
            onclick={startTimer}
            class="start-timer"
            disabled={startTimerDisabled ||
                gameStore.value.state.questionState !== "open"}
            >Start Timer</button
        >
        <button
            onclick={stopTimer}
            disabled={timerStore.value === 0}
            class="icon-btn stop-btn"
        >
            <Icon svg={stopSvg} />
        </button>
    </div>
    <div class="scoring-buttons">
        <button
            onclick={() => scoreQuestion("correct")}
            class="scoring score-correct"
            disabled={!scoringEnabled}>Correct</button
        >
        <button
            onclick={() => scoreQuestion("incorrect")}
            class="scoring score-incorrect"
            disabled={!scoringEnabled}>Incorrect</button
        >
    </div>
    <div class="scoring-buttons">
        <button
            onclick={() => scoreQuestion("penalty")}
            class="scoring score-penalty"
            disabled={!scoringEnabled ||
                gameStore.value.state.currentQuestion?.bonus}>Penalty</button
        >
        <button
            onclick={markDead}
            class="scoring mark-dead-btn"
            disabled={gameStore.value.state.questionState !== "open" ||
                gameStore.value.state.currentQuestion.bonus}>Mark Dead</button
        >
    </div>
    <button
        onclick={() => (scoreboardExpanded = !scoreboardExpanded)}
        class="expand-scoreboard"
    >
        {#if scoreboardExpanded}
            Collapse Scoreboard
        {:else}
            Expand Scoreboard
        {/if}
    </button>
</ControlSection>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    .scoring-buttons {
        display: flex;
        gap: 0.5em;
        width: 100%;

        button.scoring {
            flex: 1;

            &.score-correct:not(:disabled) {
                background: rgba($green, 0.15);
                color: $green;
                border-color: rgba($green, 0.3);
            }

            &.score-incorrect:not(:disabled) {
                background: rgba($red, 0.15);
                color: $red;
                border-color: rgba($red, 0.3);
            }

            &.score-penalty:not(:disabled) {
                background: rgba($purple, 0.15);
                color: $purple-dark;
                border-color: rgba($purple, 0.3);
            }

            &.mark-dead-btn:not(:disabled) {
                background: rgba($gray-static, 0.15);
                color: $gray-2;
                border-color: rgba($gray-static, 0.3);
            }
        }
    }

    .start-timer {
        background: $primary;
        width: 100%;
    }

    button {
        @extend %button;
        font-size: 1.25rem;
        padding: 0.5em 0.5em;
    }

    .icon-btn {
        padding: 0.75em;
        display: flex;
        align-items: center;
        justify-content: center;
        background: $primary;
        color: $text-light;
    }
</style>
