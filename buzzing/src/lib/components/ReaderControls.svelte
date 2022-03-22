<script lang="ts">
    import ControlSection from '$lib/components/ControlSection.svelte'
    import Select from 'svelte-select'
    import type { Socket } from 'socket.io-client';
    import type { Writable } from 'svelte/store'
    import type { TeamData } from '$lib/classes/Team'
    import type { Category } from '$lib/classes/Game';
    import { getContext } from 'svelte';
    import type Debugger from '$lib/classes/Debugger';
    import chatMessagesStore from '$lib/stores/chatMessages';
    import teamsStore from '$lib/stores/teams';
    import modalStore from '$lib/stores/modal';
    export let socket: Writable<Socket>
    export let questionState: 'idle' | 'open' | 'buzzed'
    
    let categorySelect: HTMLSelectElement
    let teamSelect: HTMLSelectElement
    let selectedCategory: Category | ""
    let selectedTeam: string
    let questionType: "tossup" | "bonus" | ""
    const categories: { id: Category, value: string }[] = [
        {id:"earth", value:"Earth and Space"},
        {id:"bio", value:"Biology"},
        {id:"chem", value:"Chemistry"},
        {id:"physics", value:"Physics"},
        {id:"math", value:"Math"},
        {id:"energy", value:"Energy"}
    ]
        
    
    
    const debug: Debugger = getContext('debug')

    function newQ() {
        $socket.emit('newQ', {
            category: selectedCategory,
            bonus: questionType === "bonus",
            team: questionType === "bonus" ? selectedTeam : null
        })

        debug.addEvent('newQ', {
            category: selectedCategory,
            bonus: questionType === "bonus",
            team: questionType === "bonus" ? selectedTeam : null
        })

        $chatMessagesStore = [...$chatMessagesStore, {
            type: 'notification',
            text: 'New question opened'
        }]

        questionState = 'open'

        categorySelect.selectedIndex = 0
        teamSelect.selectedIndex = 0;
        (<HTMLInputElement>document.querySelector('input[name="question-type"]:checked')).checked = false
        selectedCategory = ""
        selectedTeam = ""
        questionType = ""
    }
    
    function startTimer() {
        $socket.emit('startTimer')
        debug.addEvent('startTimer', {})
    }
    function endGame() {
        $modalStore = {
            title: 'End Game',
            message: 'Are you sure you want to end the game?',
            options: [
                {
                    text: 'Cancel',
                    callback: () => {
                        $modalStore = null
                    }
                },
                {
                    text: 'Confirm',
                    callback: () => {
                        $socket.emit('endGame')
                        debug.addEvent('endGame', {})
                    }
                }
            ]
        }
    }
    function clearScores() {
        $socket.emit('clearScores')
        debug.addEvent('clearScores', {})
    }
    function saveScores() {
        $socket.emit('saveScores')
        debug.addEvent('saveScores', {})
    }

    let selectedScore: "correct" | "incorrect" | "penalty" | ""
    function scoreQuestion() {
        $socket.emit('scoreQuestion', selectedScore)
        selectedScore = ""
        debug.addEvent('scoreQuestion', { selectedScore })
    }

    function handleTeamSelect(e: CustomEvent<TeamData>) {
        selectedTeam = e.detail.id
    }
    function handleSubjectSelect(e: CustomEvent<{ id: Category, value: string }>) {
        selectedCategory = e.detail.id
    }
</script>

<div id="buttons">
    <ControlSection title="Questions" style="display: flex; flex-direction: column; align-items: center;">
        <div id="question-type-wrapper">
            <label for="tossup-radio">
                <input type="radio" id="tossup-radio" name="question-type" value="tossup" bind:group={questionType}>
                <span>Tossup</span>
            </label>
            <label for="bonus-radio">
                <input type="radio" id="bonus-radio" name="question-type" value="bonus" bind:group={questionType}>
                <span>Bonus</span>
            </label>
        </div>
        <br />
        <div id="target-team-wrapper"  class:hidden={questionType !== 'bonus'}>
            <div class="select-wrapper"><Select items={$teamsStore} optionIdentifier="id" labelIdentifier="name" placeholder="Bonus for" on:select={handleTeamSelect}/></div>
        </div>
        <br />
            <div class="select-wrapper"><Select items={categories} optionIdentifier="id" labelIdentifier="value" placeholder="Category" on:select={handleSubjectSelect}/></div>
        <br />
        <button on:click={newQ} disabled={!questionType || !selectedCategory}>New Question</button>
    </ControlSection>
    <ControlSection title="Scoring" style="display: flex; flex-direction: column; align-items: center;">
        <button on:click={startTimer} id="start-timer" disabled={questionState !== "open"}>Start Timer</button>
        <br />
        <div id="score-wrapper" class:disabled={questionState !== "buzzed"}>
            <label for="correct-radio">
                <input type="radio" id="correct-radio" name="selected-score" value="correct" bind:group={selectedScore} disabled={questionState !== "buzzed"}>
                <span>Correct</span>
            </label>
            <label for="incorrect-radio">
                <input type="radio" id="incorrect-radio" name="selected-score" value="incorrect" bind:group={selectedScore} disabled={questionState !== "buzzed"}>
                <span>Incorrect</span>
            </label>
            <label for="penalty-radio">
                <input type="radio" id="penalty-radio" name="selected-score" value="penalty" bind:group={selectedScore} disabled={questionState !== "buzzed"}>
                <span>Penalty</span>
            </label>
        </div>
        <button on:click={scoreQuestion} disabled={questionState !== "buzzed" || !selectedScore}>Score</button> 
    </ControlSection>
    <ControlSection title="Scoreboard">
        <button on:click={clearScores}>Clear Scores</button>
        <button on:click={saveScores}>Save Scores</button>
    </ControlSection>
    <ControlSection title="Game Control">
        <button on:click={endGame} id="endGame">End Game</button>
    </ControlSection>
</div>

<style lang="scss">
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
        background: #EEE;
    }

    button {
        color: #EEE;
        background: var(--green);
        font-size: 20px;
        font-weight: bold;
        padding: 0.6em;
        border-radius: 0.6em;
        border: solid black 3px;
        cursor: pointer;
    }

    button:disabled {
        border: solid var(--green) 3px;
        background: transparent;
        color: #444;
        cursor: default;
    }

    .select-wrapper {
        min-width: 10em;
        --background:white;
        --border: .1em solid green;
        --border-radius: .5em;
        
    }

    #question-type-wrapper label {
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
                color: #000;
                font-weight: bold;
            }

            &:disabled ~ span {
                color: #444;
                font-weight: normal;
            }

            &:checked ~ span {
                border: 2px solid var(--blue);
                padding: calc(0.3em - 2px);
                border-radius: 0.3em;
            }
        }

        span {
            padding: 0.3em;
            display: inline-block;

            &:hover {
                text-decoration: underline #000 2px;
            }
        }
    }

    #score-wrapper {
        margin-bottom: 0.5em;
    }

    #score-wrapper label {
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
                color: #000;
                font-weight: bold;
            }

            &:disabled ~ span {
                color: #444;
                font-weight: normal;
            }

            &:checked ~ span {
                border: 2px solid;
                padding: calc(0.3em - 2px);
                border-radius: 0.3em;
            }
        }

        #correct-radio:checked ~ span {
            border-color: var(--green);
        }

        #incorrect-radio:checked ~ span {
            border-color: var(--red);
        }

        #penalty-radio:checked ~ span {
            border-color: var(--red);
        }

        span {
            padding: 0.3em;
            display: inline-block;
            border: none;

            &:hover {
                text-decoration: underline #000 2px;
            }
        }
    }

    #score-wrapper.disabled {
        cursor: default;

        label {
            cursor: default;

            span {
                color: #333;

                &:hover {
                    text-decoration: none;
                }
            }

            input:checked ~ span {
                padding: 0.3em;
                border: none;
            }
        }
    }
    
    #target-team-wrapper.hidden {
        visibility: hidden;
    }
</style>

