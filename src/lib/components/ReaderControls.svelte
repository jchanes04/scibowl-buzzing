<script lang="ts">
    import ControlSection from '$lib/components/ControlSection.svelte'

    type Message = {
        text: string
        type: 'buzz' | 'notification' | 'warning' | 'success'
    }

    import type { Socket } from 'socket.io-client';
    import type { Writable } from 'svelte/store'
    import type Timer from './Timer.svelte'
    import type { IndividualTeamClean } from '$lib/classes/IndividualTeam';
    import type { TeamClean } from '$lib/classes/Team'
    export let socket: Writable<Socket>
    export let messages: Writable<Message[]>
    export let teamList: Array<TeamClean | IndividualTeamClean>
    export let state: 'idle' | 'open' | 'buzzed'
    
    let categorySelect: HTMLSelectElement
    let teamSelect: HTMLSelectElement
    let selectedCategory
    let selectedTeam
    let questionType
    function newQ() {
        $socket.emit('newQ', {
            category: selectedCategory,
            bonus: questionType === "bonus",
            team: questionType === "bonus" ? selectedTeam : null
        })

        $messages = [...$messages, {
            type: 'notification',
            text: 'New question opened'
        }]

        state = 'open'

        categorySelect.selectedIndex = 0
        teamSelect.selectedIndex = 0;
        (<HTMLInputElement>document.querySelector('input[name="question-type"]:checked')).checked = false
        selectedCategory = ""
        selectedTeam = ""
        questionType = ""
    }
    
    function startTimer() {
        $socket.emit('startTimer')
    }
    function endGame() {
        $socket.emit('endGame')
    }
    function clearScores() {
        $socket.emit('clearScores')
    }
    function saveScores() {
        $socket.emit('saveScores')
    }

    let selectedScore
    function scoreQuestion() {
        $socket.emit('scoreQuestion', selectedScore)
        selectedScore = ""
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
        <div id="target-team-wrapper" class:hidden={questionType !== 'bonus'}>
            <select name="target-team" id="target-team" bind:this={teamSelect} bind:value={selectedTeam}>
                <option value="" hidden default></option>
                {#each teamList as team}
                    {#if team.members.length !== 1 || !team.members[0].reader}
                        <option value={team.id}>{team.name}</option>
                    {/if}
                {/each}
            </select>
        </div>
        <br />
        <select name="categories" id="category" bind:this={categorySelect} bind:value={selectedCategory}>
            <option value="" hidden default></option>
            <option value="earth">Earth and Space</option>
            <option value="bio">Biology</option>
            <option value="chem">Chemistry</option>
            <option value="physics">Physics</option>
            <option value="math">Math</option>
            <option value="energy">Energy</option>
        </select>
        <br />
        <button on:click={newQ} disabled={!questionType || !selectedCategory}>New Question</button>
    </ControlSection>
    <ControlSection title="Scoring" style="display: flex; flex-direction: column; align-items: center;">
        <button on:click={startTimer} id="start-timer" disabled={state !== "open"}>Start Timer</button>
        <br />
        <div id="score-wrapper" class:disabled={state !== "buzzed"}>
            <label for="correct-radio">
                <input type="radio" id="correct-radio" name="selected-score" value="correct" bind:group={selectedScore} disabled={state !== "buzzed"}>
                <span>Correct</span>
            </label>
            <label for="incorrect-radio">
                <input type="radio" id="incorrect-radio" name="selected-score" value="incorrect" bind:group={selectedScore} disabled={state !== "buzzed"}>
                <span>Incorrect</span>
            </label>
            <label for="penalty-radio">
                <input type="radio" id="penalty-radio" name="selected-score" value="penalty" bind:group={selectedScore} disabled={state !== "buzzed"}>
                <span>Penalty</span>
            </label>
        </div>
        <button on:click={scoreQuestion} disabled={state !== "buzzed" || !selectedScore}>Score</button> 
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

