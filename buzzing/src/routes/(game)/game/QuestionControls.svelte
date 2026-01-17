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
    import {
        moderatorsStore,
        playersStore,
        teamsStore,
        type ClientTeamData,
    } from "$lib/stores/members.svelte";
    import gameStore from "$lib/stores/game.svelte";
    import { scoreboardStore } from "$lib/stores/scoreboard.svelte";
    import { gameClockStore } from "$lib/stores/timer.svelte";
    import getSocket from "$lib/socket.svelte";
    import gameIdStore from "$lib/stores/gameId.svelte";
    import { modalStore } from "$lib/stores/modal.svelte";
    import Confirm from "$lib/components/Confirm.svelte";
    import { useConvexClient } from "convex-svelte";
    import { api } from "../../../../convex/_generated/api";

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

        // Add chat message via socket
        const gId = gameIdStore.value;
        if (gId) {
            socket.emit("addChatMessage", {
                type: "notification",
                text: `${(questionType[0] || "").toUpperCase() + questionType.slice(1)} #${questionNumber} Opened - ${(selectedCategory[0] || "").toUpperCase() + selectedCategory.slice(1)}`,
            });
        }

        gameStore.newQuestion(
            {
                category: selectedCategory as Category,
                bonus: !(questionType === "tossup"),
                number: questionNumber,
                teamId: teamSelectValue?.id as string,
                visual: questionType === "visual",
            },
            true,
        );

        questionType = "";
        visualBonusFilename = "";
    }

    function confirmNewQuestion() {
        if (gameClockStore.ended) {
            modalStore.show({
                title: "Confirm New Question",
                message:
                    "The game clock has ended. Are you sure you want to open a new question?",
                confirmCallback: () => {
                    if (
                        questionType === "tossup" &&
                        scoreboardStore.value.scores[questionNumber] &&
                        questionNumber !== 0
                    ) {
                        modalStore.show({
                            title: "Overwrite Question #" + questionNumber,
                            message: `There is already a question #${questionNumber} in the scoreboard. Are you sure you want to overwrite it?`,
                            confirmCallback: () => {
                                newQuestion();
                                modalStore.hide();
                            },
                            cancelCallback: () => {
                                modalStore.hide();
                            },
                        });
                    } else {
                        newQuestion();
                        modalStore.hide();
                    }
                },
                cancelCallback: () => {
                    modalStore.hide();
                },
            });
        } else if (
            questionType === "tossup" &&
            scoreboardStore.value.scores[questionNumber] &&
            questionNumber !== 0
        ) {
            modalStore.show({
                title: "Overwrite Question #" + questionNumber,
                message: `There is already a question #${questionNumber} in the scoreboard. Are you sure you want to overwrite it?`,
                confirmCallback: () => {
                    newQuestion();
                    modalStore.hide();
                },
                cancelCallback: () => {
                    modalStore.hide();
                },
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
</script>

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
        <div id="target-team-wrapper">
            <div
                class="select-wrapper"
                class:disabled={questionType !== "bonus" &&
                    questionType !== "visual"}
            >
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
        <button onclick={confirmNewQuestion} disabled={newQuestionDisabled}
            >New Question</button
        >
    </div>
</ControlSection>

<style lang="scss">
    @use "$styles/_global.scss" as *;

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
            @extend %button;
            padding: 0.5em;
            font-size: 1.25rem;
            flex: 1;
        }
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
    }

    .select-wrapper.disabled {
        opacity: 0.3;
        pointer-events: none;
    }
</style>
