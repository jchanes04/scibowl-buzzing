<script lang="ts">
    import ControlSection from './ControlSection.svelte'
    import Select from 'svelte-select'
    import type { Category } from '$lib/classes/Game';
    import { getContext } from 'svelte';
    import type Debugger from '$lib/classes/Debugger';
    import chatMessagesStore from '$lib/stores/chatMessages';
    import teamsStore, { type ClientTeamData } from '$lib/stores/teams';
    import gameStore from '$lib/stores/game';
    import { gameClockStore, timerStore } from '$lib/stores/timer';
    import getSocket from "$lib/socket"
    import type { Writable } from 'svelte/store';
    import Confirm from '$lib/components/Confirm.svelte';
    import TimeEntry from './TimeEntry.svelte';
    import ExpandedScoreboard from './ExpandedScoreboard.svelte';
    import Icon from '$lib/components/Icon.svelte';
    import playSvg from "$lib/icons/play.svg?raw"
    import pausePlaySvg from "$lib/icons/pause-play.svg?raw"
    import stopSvg from "$lib/icons/stop.svg?raw"
    
    let teamSelectValue: ClientTeamData | undefined
    let selectedCategory: Category | ""
    let questionType: "tossup" | "bonus" | "visual" | ""
    let visualBonusFiles: FileList
    let visualBonusFilename: string
    const categories: { id: Category, value: string }[] = [
        {id:"earth", value:"Earth and Space"},
        {id:"bio", value:"Biology"},
        {id:"chem", value:"Chemistry"},
        {id:"physics", value:"Physics"},
        {id:"math", value:"Math"},
        {id:"energy", value:"Energy"}
    ]
    
    const socket = getSocket()
    const debug: Debugger = getContext('debug')
    type ModalStore = Writable<{
        component: ConstructorOfATypedSvelteComponent,
        props: Record<string, unknown>
    } | null>
    const modalStore: ModalStore = getContext('modalStore')

    $: newQuestionDisabled = !questionType
        || !selectedCategory
        || (!teamSelectValue && questionType === "bonus")
        || ((!teamSelectValue || !visualBonusFiles) && questionType === "visual")

    let questionNumber: number = 1
    async function newQuestion() {
        if (questionType === "visual") {
            socket.emit('openVisualBonus', visualBonusFiles[0])
        }

        socket.emit('newQuestion', {
            category: selectedCategory,
            bonus: questionType === "bonus" || questionType === "visual",
            ...(questionType === "visual" ? { visual: true } : {}),
            teamId: questionType === "bonus" || questionType === "visual"
                ? teamSelectValue?.id
                : null,
            number: questionNumber
        })

        if (questionType === "tossup" && questionNumber && $gameStore.scores[questionNumber]) {
            gameStore.scoreboard.clearQuestion(questionNumber)
        }

        debug.addEvent('newQuestion', {
            category: selectedCategory,
            bonus: questionType === "bonus" || questionType === "visual",
            teamId: questionType === "bonus" || questionType === "visual"
                ? teamSelectValue?.id
                : null,
            number: questionNumber
        })

        $chatMessagesStore = [...$chatMessagesStore, {
            type: 'notification',
            text: `New Question ${questionNumber ? "#" + questionNumber : ""}: ${questionType[0].toUpperCase() + questionType.slice(1)} - ${selectedCategory[0].toUpperCase() + selectedCategory.slice(1)}`
        }]

        if (questionType === "bonus") {
            gameStore.newQuestion({
                category: selectedCategory as Category,
                bonus: true,
                teamId: teamSelectValue?.id as string,
                number: questionNumber
            }, true)
        } else if (questionType === "visual") {
            gameStore.newQuestion({
                category: selectedCategory as Category,
                bonus: true,
                visual: true,
                teamId: teamSelectValue?.id as string,
                number: questionNumber
            }, true)
        } else {
            gameStore.newQuestion({
                category: selectedCategory as Category,
                bonus: false,
                number: questionNumber
            }, true)
        }

        questionType = ""
        visualBonusFilename = ""
    }

    const timeEndedModal = (confirmCallback: () => void) => ({
        component: Confirm,
        props: {
            title: "Confirm New Question",
            message: "The game clock has ended. Are you sure you want to open a new question?",
            confirmCallback,
            cancelCallback: () => {
                $modalStore = null
            }
        }
    })
    const overwriteQuestionModal = (number: number, confirmCallback: () => void) => ({
        component: Confirm,
        props: {
            title: "Overwrite Question #" + number,
            message: `There is already a question #${number} in the scoreboard. Are you sure you want to overwrite it?`,
            confirmCallback,
            cancelCallback: () => {
                $modalStore = null
            }
        }
    })

    function confirmNewQuestion() {
        if (gameClockStore.ended) {
            $modalStore = timeEndedModal(() => {
                if (
                    questionType === "tossup"
                    && $gameStore.scores[questionNumber]
                    && questionNumber !== 0
                ) {
                    $modalStore = overwriteQuestionModal(questionNumber, () => {
                        newQuestion()
                        $modalStore = null
                    })
                } else {
                    newQuestion()
                    $modalStore = null
                }
            })
        } else if (
            questionType === "tossup"
            && $gameStore.scores[questionNumber]
            && questionNumber !== 0
        ) {
            $modalStore = overwriteQuestionModal(questionNumber, () => {
                newQuestion()
                $modalStore = null
            })
        } else {
            newQuestion()
        }   
    }

    function handleQuestionNumberChange() {
        if (questionNumber < 1) {
            questionNumber = 1
        }
    }
    
    let startTimerDisabled = false
    function startTimer() {
        startTimerDisabled = true
        setTimeout(() => startTimerDisabled = false, 500)

        socket.emit('startTimer')
        debug.addEvent('startTimer', {})
    }
    function endGame() {
        $modalStore = {
            component: Confirm,
            props: {
                title: "End Game",
                message: "Are you sure you want to end the game?",
                cancelCallback: () => {
                    $modalStore = null
                },
                confirmCallback: () => {
                    socket.emit('endGame')
                    debug.addEvent('endGame', {})
                    $modalStore = null
                }
            }
        }
    }

    let scoreboardExpanded = false

    $: scoringEnabled = $gameStore.state.questionState === "buzzed" || $gameStore.state.currentQuestion?.bonus
    function scoreQuestion(selectedScore: "correct" | "incorrect" | "penalty") {
        socket.emit('scoreQuestion', selectedScore)

        if (
            selectedScore === "incorrect"
            && $gameStore.state.buzzedTeamIds.length === Object.keys($teamsStore).length
            && questionNumber !== 0
        ) {
            questionNumber++
        }

        if (selectedScore === "correct") {
            teamSelectValue = $teamsStore[$gameStore.state.buzzedTeamIds[$gameStore.state.buzzedTeamIds.length - 1]]
        }

        if ($gameStore.state.currentQuestion?.bonus && questionNumber !== 0) {
            questionNumber++
        }

        debug.addEvent('scoreQuestion', { selectedScore })
    }

    function markDead() {
        socket.emit("markDead")
        questionNumber++

        debug.addEvent("markDead", {})
    }

    let gameClockTime: number
    let startGameClockDisabled = false
    function startGameClock() {
        startGameClockDisabled = true
        setTimeout(() => startGameClockDisabled = false, 1000)

        socket.emit('startGameClock', gameClockTime)
        debug.addEvent('startGameClock', { gameClockTime })
        gameClockTime = 0
    }

    let pauseGameClockDisabled = false
    function pauseGameClock() {
        pauseGameClockDisabled = true
        setTimeout(() => pauseGameClockDisabled = false, 1000)

        socket.emit("pauseGameClock")
        debug.addEvent("pauseGameClock", {})
    }

    let stopGameClockDisabled = false
    function stopGameClock() {
        stopGameClockDisabled = true
        setTimeout(() => stopGameClockDisabled = false, 1000)

        socket.emit('stopGameClock')
        debug.addEvent("stopGameClock", {})
    }

    function stopTimer() {
        timerStore.stop()

        socket.emit("stopTimer")
    }
</script>

<div id="buttons">
    <ControlSection title="Questions" style="display: flex; flex-direction: column; align-items: center;">
        <div class="multi-choice">
            <label for="tossup-radio">
                <input type="radio" id="tossup-radio" name="question-type" value="tossup" bind:group={questionType}>
                <span>Tossup</span>
            </label>
            <label for="bonus-radio">
                <input type="radio" id="bonus-radio" name="question-type" value="bonus" bind:group={questionType}>
                <span>Bonus</span>
            </label>
            <label for="visual-radio">
                <input type="radio" id="visual-radio" name="question-type" value="visual" bind:group={questionType}>
                <span>Visual Bonus</span>
            </label>
        </div>
        <br />
        {#if questionType === "visual"}
            <label class="file-input-wrapper" for="visual-bonus-upload">
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
            <br />
        {/if}
        <div id="target-team-wrapper"  class:hidden={questionType !== 'bonus' && questionType !== 'visual'}>
            <div class="select-wrapper">
                <Select items={Object.values($teamsStore)} itemId="id" label="name" placeholder="Bonus for" searchable={false} showChevron={true}
                    bind:value={teamSelectValue} />
            </div>
        </div>
        <br />
        <div class="select-wrapper">
            <Select items={categories} itemId="id" label="value" placeholder="Category" searchable={false} showChevron={true}
                bind:justValue={selectedCategory}/>
        </div>
        <br />
        <div class="new-question-wrapper">
            <input type="number" bind:value={questionNumber} on:change={handleQuestionNumberChange} />
            <button on:click={confirmNewQuestion} disabled={newQuestionDisabled}>New Question</button>
        </div>
    </ControlSection>
    <ControlSection title="Scoring" style="display: flex; flex-direction: column; align-items: center;">
        <div>
            <button on:click={startTimer} id="start-timer" disabled={startTimerDisabled || $gameStore.state.questionState !== "open"}>Start Timer</button>
            <button on:click={stopTimer} disabled={$timerStore === 0}>
                <Icon svg={stopSvg} />
            </button>
        </div>
        <br />
        <div class="scoring-buttons">
            <button on:click={() => scoreQuestion("correct")}
                class="scoring score-correct" disabled={!scoringEnabled}>Correct</button>
            <button on:click={() => scoreQuestion("incorrect")}
                class="scoring score-incorrect" disabled={!scoringEnabled}>Incorrect</button>
            <button on:click={() => scoreQuestion("penalty")}
                class="scoring score-penalty" disabled={!scoringEnabled || $gameStore.state.currentQuestion?.bonus}>Penalty</button>
        </div>
        <br />
        <button on:click={markDead} disabled={$gameStore.state.questionState !== "open" || $gameStore.state.currentQuestion.bonus}>Mark Dead</button>
        <br />
        <button on:click={() => scoreboardExpanded = true}>Expand Scoreboard</button>
    </ControlSection>
    <ControlSection title="Game Control">
        <TimeEntry bind:value={gameClockTime} />
        <br /><br />
        <button disabled={startGameClockDisabled || gameClockTime === 0} on:click={startGameClock}>
            <Icon svg={playSvg} />
        </button>
        <button disabled={pauseGameClockDisabled} on:click={pauseGameClock}>
            <Icon svg={pausePlaySvg} />
        </button>
        <button disabled={stopGameClockDisabled} on:click={stopGameClock}>
            <Icon svg={stopSvg} />
        </button>
        <br /><br />
        <button on:click={endGame} id="endGame">End Game</button>
    </ControlSection>

    {#if scoreboardExpanded}
        <div class="expanded-scoreboard-wrapper">
            <ExpandedScoreboard on:close={() => scoreboardExpanded = false} />
        </div>
    {/if}
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    #buttons {
        padding: 1em;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;

        grid-area: control-panel;
        box-sizing: border-box;
        border-radius: 1em;
        background: $background-1;
        position: relative;
    }

    button {
        @extend %button;

        font-size: 20px;
        padding: 0.6em;
        border-radius: 0.6em;
    }

    .select-wrapper {
        width: 14em;
        --background:white;
        --border-radius: .5em;
        --selected-item-padding: 0;

        :global(.svelte-select) {
            box-sizing: border-box;
        }
    }

    input[type="number"] {
        border: none;
        width: 3.5ch;
        font-size: 22px;
        border-radius: 0.3em;
        padding: 0.3em;
        border: 0.1em solid $green;
    }

    .multi-choice label {
        cursor: pointer;
        position: relative;
        
        input {
            visibility: hidden;
            width: 0;
            height: 0;
            position: absolute;
            top: 0;
            left: 0;

            & ~ span {
                color: black;
                font-weight: bold;
                border: 2px solid transparent;
            }

            &:disabled ~ span {
                color: #444;
                font-weight: normal;
            }

            &:checked ~ span {
                border: 2px solid $blue;
                padding: 0.3em;
                border-radius: 0.3em;
            }
        }

        span {
            padding: 0.3em;
            display: inline-block;
            box-sizing: border-box;

            &:hover {
                text-decoration: underline black 2px;
            }
        }
    }

    button.scoring {
        background: transparent;
        font-size: 18px;
        color: black;
        border: none;
        padding: 0.3em;
        width: 9ch;
        text-align: center;

        &:disabled {
            color: #444;
            font-weight: 500;
        }
    }

    .score-correct:hover:not(:disabled) {
        text-decoration: underline $green 3px;
    }

    .score-incorrect:hover:not(:disabled), .score-penalty:hover:not(:disabled) {
        text-decoration: underline $red 3px;
    }
    
    .file-input-wrapper {
        cursor: pointer;

        input[type="file"] {
            display: none;
        }

        span {
            display: inline-block;
            padding: 0.3em;
            border-radius: 0.3em;
            border: 1px solid black;
        }
    }

    #target-team-wrapper.hidden {
        visibility: hidden;
    }

    .expanded-scoreboard-wrapper {
        inset: 0;
        position: absolute;
    }
</style>

