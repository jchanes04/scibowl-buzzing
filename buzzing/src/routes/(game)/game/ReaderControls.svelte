<script lang="ts">
    import ControlSection from "./ControlSection.svelte";
    import Select from "svelte-select";
    import type { Category } from "$lib/classes/Game";
    import { getContext } from "svelte";
    import { slide } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import type Debugger from "$lib/classes/Debugger";

    function horizontalSlide(node: HTMLElement, { duration = 200 }) {
        const style = getComputedStyle(node);
        const padding_left = parseFloat(style.paddingLeft);
        const padding_right = parseFloat(style.paddingRight);
        const margin_left = parseFloat(style.marginLeft);
        const border_left_width = parseFloat(style.borderLeftWidth);
        const border_right_width = parseFloat(style.borderRightWidth);

        return {
            duration,
            easing: cubicOut,
            css: (t: number) => `
                flex: ${t} 1 0%;
                opacity: ${t};
                overflow: hidden;
                white-space: nowrap;
                padding-left: ${t * padding_left}px;
                padding-right: ${t * padding_right}px;
                border-left-width: ${t * border_left_width}px;
                border-right-width: ${t * border_right_width}px;
                margin-left: ${t * margin_left}px;
                min-width: 0;
            `,
        };
    }
    import { teamsStore, type ClientTeamData } from "$lib/stores/members.svelte";
    import gameStore from "$lib/stores/game.svelte";
    import { scoreboardStore } from "$lib/stores/scoreboard.svelte";
    import { gameClockStore, timerStore } from "$lib/stores/timer.svelte";
    import getSocket from "$lib/socket.svelte";
    import type { Writable } from "svelte/store";
    import Confirm from "$lib/components/Confirm.svelte";
    import TimeEntry from "./TimeEntry.svelte";
    import ExpandedScoreboard from "$lib/components/ExpandedScoreboard.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import playSvg from "$lib/icons/play.svg?raw";
    import pausePlaySvg from "$lib/icons/pause-play.svg?raw";
    import stopSvg from "$lib/icons/stop.svg?raw";
    import { useConvexClient } from "convex-svelte";
    import { api } from "../../../../convex/_generated/api";
    import gameIdStore from "$lib/stores/gameId.svelte";

    let teamSelectValue = $state<ClientTeamData | undefined>();
    let selectedCategory: Category | "" = $state("");
    let questionType: "tossup" | "bonus" | "visual" | "" = $state("");
    let visualBonusFiles: FileList | undefined = $state();
    let visualBonusFilename: string = $state("");
    const categories: { id: Category; value: string }[] = [
        { id: "earth", value: "Earth and Space" },
        { id: "bio", value: "Biology" },
        { id: "chem", value: "Chemistry" },
        { id: "physics", value: "Physics" },
        { id: "math", value: "Math" },
        { id: "energy", value: "Energy" },
    ];

    const socket = getSocket();
    const debug: Debugger = getContext("debug");
    const convex = useConvexClient();
    type ModalStore = Writable<{
        component: any;
        props: Record<string, unknown>;
    } | null>;
    const modalStore: ModalStore = getContext("modalStore");

    let newQuestionDisabled = $derived(
        !questionType ||
            !selectedCategory ||
            (!teamSelectValue && questionType === "bonus") ||
            ((!teamSelectValue || !visualBonusFiles) &&
                questionType === "visual"),
    );

    let questionNumber: number = $state(1);
    async function newQuestion() {
        if (questionType === "visual" && visualBonusFiles?.[0]) {
            socket.emit("openVisualBonus", visualBonusFiles[0]);
        }

        socket.emit("newQuestion", {
            category: selectedCategory,
            bonus: questionType === "bonus" || questionType === "visual",
            ...(questionType === "visual" ? { visual: true } : {}),
            teamId:
                questionType === "bonus" || questionType === "visual"
                    ? teamSelectValue?.id
                    : null,
            number: questionNumber,
        });

        // Scoreboard clearing handled by Convex mutations

        debug.addEvent("newQuestion", {
            category: selectedCategory,
            bonus: questionType === "bonus" || questionType === "visual",
            teamId:
                questionType === "bonus" || questionType === "visual"
                    ? teamSelectValue?.id
                    : null,
            number: questionNumber,
        });

        // Add chat message via Convex
        const gId = gameIdStore.value;
        if (gId) {
            convex.mutation(api.chatMessages.add, {
                gameId: gId,
                type: "notification",
                text: `New Question ${questionNumber ? "#" + questionNumber : ""}: ${(questionType[0] || "").toUpperCase() + questionType.slice(1)} - ${(selectedCategory[0] || "").toUpperCase() + selectedCategory.slice(1)}`,
            });
        }

        if (questionType === "bonus") {
            gameStore.newQuestion(
                {
                    category: selectedCategory as Category,
                    bonus: true,
                    teamId: teamSelectValue?.id as string,
                    number: questionNumber,
                },
                true,
            );
        } else if (questionType === "visual") {
            gameStore.newQuestion(
                {
                    category: selectedCategory as Category,
                    bonus: true,
                    visual: true,
                    teamId: teamSelectValue?.id as string,
                    number: questionNumber,
                },
                true,
            );
        } else {
            gameStore.newQuestion(
                {
                    category: selectedCategory as Category,
                    bonus: false,
                    number: questionNumber,
                },
                true,
            );
        }

        questionType = "";
        visualBonusFilename = "";
    }

    const timeEndedModal = (confirmCallback: () => void) => ({
        component: Confirm,
        props: {
            title: "Confirm New Question",
            message:
                "The game clock has ended. Are you sure you want to open a new question?",
            confirmCallback,
            cancelCallback: () => {
                $modalStore = null;
            },
        },
    });
    const overwriteQuestionModal = (
        number: number,
        confirmCallback: () => void,
    ) => ({
        component: Confirm,
        props: {
            title: "Overwrite Question #" + number,
            message: `There is already a question #${number} in the scoreboard. Are you sure you want to overwrite it?`,
            confirmCallback,
            cancelCallback: () => {
                $modalStore = null;
            },
        },
    });

    function confirmNewQuestion() {
        if (gameClockStore.ended) {
            $modalStore = timeEndedModal(() => {
                if (
                    questionType === "tossup" &&
                    scoreboardStore.value.scores[questionNumber] &&
                    questionNumber !== 0
                ) {
                    $modalStore = overwriteQuestionModal(questionNumber, () => {
                        newQuestion();
                        $modalStore = null;
                    });
                } else {
                    newQuestion();
                    $modalStore = null;
                }
            });
        } else if (
            questionType === "tossup" &&
            scoreboardStore.value.scores[questionNumber] &&
            questionNumber !== 0
        ) {
            $modalStore = overwriteQuestionModal(questionNumber, () => {
                newQuestion();
                $modalStore = null;
            });
        } else {
            newQuestion();
        }
    }

    function handleQuestionNumberChange() {
        if (questionNumber < 1) {
            questionNumber = 1;
        }
    }

    let startTimerDisabled = $state(false);
    function startTimer() {
        startTimerDisabled = true;
        setTimeout(() => (startTimerDisabled = false), 500);

        socket.emit("startTimer");
        debug.addEvent("startTimer", {});
    }
    function endGame() {
        $modalStore = {
            component: Confirm,
            props: {
                title: "End Game",
                message: "Are you sure you want to end the game?",
                cancelCallback: () => {
                    $modalStore = null;
                },
                confirmCallback: () => {
                    socket.emit("endGame");
                    debug.addEvent("endGame", {});
                    $modalStore = null;
                },
            },
        };
    }

    let scoreboardExpanded = $state(false);

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
                    });
                } else {
                    convex.mutation(api.games.incorrectBonus, {
                        gameId: gId,
                        number,
                        teamId,
                        category,
                    });
                }
            } else {
                if (!currentBuzzer) return;
                const playerId = currentBuzzer.id;
                const teamId = currentBuzzer.team?.id;
                if (!teamId) return;

                if (selectedScore === "correct") {
                    convex.mutation(api.games.correctTossup, {
                        gameId: gId,
                        number,
                        playerId,
                        teamId,
                        category,
                    });
                } else if (selectedScore === "incorrect") {
                    convex.mutation(api.games.incorrectTossup, {
                        gameId: gId,
                        number,
                        playerId,
                        teamId,
                        category,
                    });
                } else if (selectedScore === "penalty") {
                    convex.mutation(api.games.penalty, {
                        gameId: gId,
                        number,
                        playerId,
                        teamId,
                        category,
                    });
                }
            }
        }

        socket.emit("scoreQuestion", selectedScore);

        // Add chat message via Convex
        if (gId) {
            const category = gameStore.value.state.currentQuestion?.category || "";
            const categoryDisplay = category ? (category[0] || "").toUpperCase() + category.slice(1) : "";

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

            convex.mutation(api.chatMessages.add, {
                gameId: gId,
                type: messageType,
                text: messageText,
            });
        }

        if (
            selectedScore === "incorrect" &&
            gameStore.value.state.buzzedTeamIds.length ===
                Object.keys(teamsStore.value).length &&
            questionNumber !== 0
        ) {
            questionNumber++;
        }

        if (selectedScore === "correct") {
            teamSelectValue =
                teamsStore.value[
                    gameStore.value.state.buzzedTeamIds[
                        gameStore.value.state.buzzedTeamIds.length - 1
                    ]!
                ];
        }

        if (gameStore.value.state.currentQuestion?.bonus && questionNumber !== 0) {
            questionNumber++;
        }

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
            });
        }

        socket.emit("markDead");
        questionNumber++;

        // Add chat message via Convex
        if (gId) {
            convex.mutation(api.chatMessages.add, {
                gameId: gId,
                type: "warning",
                text: "Question marked dead",
            });
        }

        debug.addEvent("markDead", {});
    }

    let gameClockTime: number = $state(0);
    let startGameClockDisabled = $state(false);
    function startGameClock() {
        startGameClockDisabled = true;
        setTimeout(() => (startGameClockDisabled = false), 1000);

        const minutes = Math.floor(gameClockTime / 60);
        const seconds = gameClockTime % 60;
        const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

        socket.emit("startGameClock", gameClockTime);

        // Add chat message via Convex
        const gId = gameIdStore.value;
        if (gId) {
            convex.mutation(api.chatMessages.add, {
                gameId: gId,
                type: "notification",
                text: `${timeDisplay} game clock started`,
            });
        }

        debug.addEvent("startGameClock", { gameClockTime });
        gameClockTime = 0;
    }

    let pauseGameClockDisabled = $state(false);
    function pauseGameClock() {
        pauseGameClockDisabled = true;
        setTimeout(() => (pauseGameClockDisabled = false), 1000);

        socket.emit("pauseGameClock");

        // Add chat message via Convex
        const gId = gameIdStore.value;
        if (gId) {
            const messageText = gameClockStore.live ? "Game clock paused" : "Game clock resumed";
            convex.mutation(api.chatMessages.add, {
                gameId: gId,
                type: "notification",
                text: messageText,
            });
        }

        debug.addEvent("pauseGameClock", {});
    }

    let stopGameClockDisabled = $state(false);
    function stopGameClock() {
        stopGameClockDisabled = true;
        setTimeout(() => (stopGameClockDisabled = false), 1000);

        socket.emit("stopGameClock");

        // Add chat message via Convex
        const gId = gameIdStore.value;
        if (gId) {
            convex.mutation(api.chatMessages.add, {
                gameId: gId,
                type: "notification",
                text: "Game clock stopped",
            });
        }

        debug.addEvent("stopGameClock", {});
    }

    function stopTimer() {
        timerStore.stop();

        socket.emit("stopTimer");
    }
</script>

<div id="buttons" class:scoreboard-expanded={scoreboardExpanded}>
    <div class="controls-grid">
        <ControlSection
            title="Questions"
            style="display: flex; flex-direction: column; gap: 1rem;"
        >
            <div class="multi-choice">
                <label for="tossup-radio">
                    <input
                        type="radio"
                        id="tossup-radio"
                        name="question-type"
                        value="tossup"
                        bind:group={questionType}
                    />
                    <span>Tossup</span>
                </label>
                <label for="bonus-radio">
                    <input
                        type="radio"
                        id="bonus-radio"
                        name="question-type"
                        value="bonus"
                        bind:group={questionType}
                    />
                    <span>Bonus</span>
                </label>
                <label for="visual-radio">
                    <input
                        type="radio"
                        id="visual-radio"
                        name="question-type"
                        value="visual"
                        bind:group={questionType}
                    />
                    <span>Visual Bonus</span>
                </label>
            </div>
            <span style="display :flex;  flex-direction: row;">
                <div
                    id="target-team-wrapper"
                    class:disabled={questionType !== "bonus" &&
                        questionType !== "visual"}
                >
                    <div class="select-wrapper">
                        <Select
                            items={Object.values(teamsStore.value)}
                            itemId="id"
                            label="name"
                            placeholder="Bonus for"
                            searchable={false}
                            showChevron={true}
                            bind:value={teamSelectValue}
                        />
                    </div>
                </div>

                {#if questionType === "visual"}
                    <label
                        class="file-input-wrapper"
                        for="visual-bonus-upload"
                        transition:horizontalSlide={{ duration: 200 }}
                    >
                        <input
                            type="file"
                            id="visual-bonus-upload"
                            accept="image/png, image/jpeg"
                            bind:files={visualBonusFiles}
                            bind:value={visualBonusFilename}
                        />
                        <span>
                            {#if visualBonusFiles?.[0]}
                                {visualBonusFiles[0].name}
                            {:else}
                                Choose File
                            {/if}
                        </span>
                    </label>
                {/if}
            </span>
            <div class="select-wrapper">
                <Select
                    items={categories}
                    itemId="id"
                    label="value"
                    placeholder="Category"
                    searchable={false}
                    showChevron={true}
                    bind:justValue={selectedCategory}
                />
            </div>

            <div class="new-question-wrapper">
                <input
                    type="number"
                    bind:value={questionNumber}
                    onchange={handleQuestionNumberChange}
                />
                <button
                    onclick={confirmNewQuestion}
                    disabled={newQuestionDisabled}>New Question</button
                >
            </div>
        </ControlSection>

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
                        gameStore.value.state.currentQuestion.bonus}
                    >Mark Dead</button
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

        <ControlSection
            title="Game Clock"
            style="display: flex; flex-direction: column; align-items: center; gap: 1.5rem;"
        >
            <div class="game-clock-wrapper">
                <TimeEntry bind:value={gameClockTime} />
            </div>
            <div class="game-control-buttons">
                <button
                    disabled={startGameClockDisabled || gameClockTime === 0}
                    onclick={startGameClock}
                    class="icon-btn control-btn"
                >
                    <Icon svg={playSvg} />
                </button>
                <button
                    disabled={pauseGameClockDisabled || gameClockStore.value === 0}
                    onclick={pauseGameClock}
                    class="icon-btn control-btn"
                >
                    <Icon svg={pausePlaySvg} />
                </button>
                <button
                    disabled={stopGameClockDisabled ||
                        (gameClockStore.value === 0 && !gameClockStore.ended)}
                    onclick={stopGameClock}
                    class="icon-btn control-btn"
                >
                    <Icon svg={stopSvg} />
                </button>
            </div>

            <button onclick={endGame} id="endGame">End Game</button>
        </ControlSection>
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

    .game-clock-wrapper {
        border: 3px solid $border-color;
        border-radius: 0.5em;
        padding: 1em;
        align-items: center;
        transition: border-color 0.2s ease;

        &:focus-within {
            border-color: $primary;
        }
    }

    .controls-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5em;
        justify-content: center;
        align-items: start;
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

    .game-control-buttons {
        display: flex;
        gap: 1rem;
    }

    .control-btn {
        width: 4rem;
        height: 4rem;
        border-radius: 0.5em;
        font-size: 1.5rem;
    }

    #endGame {
        background: $red;
        width: 100%;
    }

    .select-wrapper {
        @extend %select-wrapper;
        width: calc(100% - 0.25rem);
    }

    input[type="number"] {
        @extend %text-input;
        width: 5ch;
        text-align: center;
        margin: 0;
        padding: 0.5em;
        font-weight: 700;
        font-size: 1.1rem;
    }

    .multi-choice {
        display: flex;
        gap: 0.25em;
        background: $gray-1;
        padding: 0.3em;
        border-radius: 0.75em;
        border: 3px solid $border-color;
        width: calc(100% - 0.75rem);
        align-items: stretch;

        label {
            cursor: pointer;
            flex: 1;
            display: flex;

            input {
                position: absolute;
                opacity: 0;
                width: 0;
                height: 0;

                &:checked ~ span {
                    background: $background-1;
                    color: $primary;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                }

                &:disabled ~ span {
                    color: $gray-2;
                    cursor: not-allowed;
                }
            }

            span {
                display: flex;
                align-items: center;
                justify-content: center;
                flex: 1;
                padding: 0;
                border-radius: 0.5em;
                font-size: 1rem;
                font-weight: 600;
                transition: all 0.2s;
                color: $gray-2;
                text-align: center;
                line-height: 1.2;
                min-height: 2.5rem;

                &:hover {
                    background: $background-1;
                    color: $primary;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                }
            }
        }
    }

    .new-question-wrapper {
        display: flex;
        gap: 0.75em;
        width: 100%;

        button {
            flex: 1;
        }
    }

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

    .file-input-wrapper {
        @extend %text-input;
        display: block;
        flex: 1 1 0%;
        min-width: 0;
        margin-left: 0.5rem;
        box-sizing: border-box;
        cursor: pointer;
        text-align: center;
        background: $gray-1;
        border-style: dashed;
        margin: 0;
        padding: auto;
        overflow: hidden;
        text-overflow: ellipsis;

        input[type="file"] {
            display: none;
        }

        span {
            font-size: 1.25rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: $gray-2;
        }
    }

    #target-team-wrapper {
        flex: 1 1 0%;
        min-width: 0;

        &.disabled {
            opacity: 0.3;
            pointer-events: none;
        }
    }

    .expanded-scoreboard-wrapper {
        width: 100%;
        position: relative;
    }
</style>
