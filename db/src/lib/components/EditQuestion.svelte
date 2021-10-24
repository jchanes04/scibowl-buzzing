<script lang="ts">
    import type { category, McqQuestion, SaQuestion } from "src/mongo";
    export let question: SaQuestion | McqQuestion

    let textareaWidth: number
    $: textareaHeight = Math.ceil((questionText.length + 15) * 11.25 / textareaWidth) * 18

    let category: category = question.category
    let type: "MCQ" | "SA" = question.type
    let questionText: string = question.questionText
    let choices = question.type === "MCQ" ? question.choices : { W: "", X: "", Y: "", Z: "" }
    let optionW: string = choices?.W
    let optionX: string = choices?.X
    let optionY: string = choices?.Y
    let optionZ: string = choices?.Z
    let correctAnswer = question.correctAnswer

    function submitChanges() {

    }
</script>

<div id="question" class={category}>
    <select name="category" bind:value={category}>
        <option value="bio">Biology</option>
        <option value="earth">Earth and Space</option>
        <option value="chem">Chemistry</option>
        <option value="physics">Physics</option>
        <option value="math">Math</option>
        <option value="energy">Energy</option>
    </select>
    <br />
    <div class="textarea-wrapper" bind:clientWidth={textareaWidth}>
        <textarea class="question-text" name="question-text" 
            bind:value={questionText}
            style={`height: ${textareaHeight}px`}
        ></textarea>
    </div>
    <br />
    {#if type === "MCQ"}    
        <div class="radio-wrapper">
            <label>
                <input id="option-w-selected" type="radio" name="correct-answer" value="W" bind:group={correctAnswer} />
                <span />
                <p>W)</p>
                <textarea class="choice" name="W" placeholder="Option W" id="W-input" bind:value={optionW} />
            </label>
            <br />
            <label>
                <input id="option-x-selected" type="radio" name="correct-answer" value="X" bind:group={correctAnswer} />
                <span />
                <p>X)</p>
                <textarea class="choice" name="X" placeholder="Option X" id="X-input" bind:value={optionX} />
            </label>
            <br />
            <label>
                <input id="option-y-selected" type="radio" name="correct-answer" value="Y" bind:group={correctAnswer} />
                <span />
                <p>Y)</p>
                <textarea class="choice" name="Y" placeholder="Option Y" id="Y-input" bind:value={optionY} />
            </label>
            <br />
            <label>
                <input id="option-z-selected" type="radio" name="correct-answer" value="Z" bind:group={correctAnswer} />
                <span />
                <p>Z)</p>
                <textarea class="choice" name="Z" placeholder="Option Z" id="Z-input" bind:value={optionZ} />
            </label>          
        </div>
    {:else if type === "SA"}
        <input type="text" name="answer" placeholder="Answer" id="answer-input" bind:value={correctAnswer} />
    {/if}
    <br />
    <button on:click={submitChanges}>Save Changes</button>
</div>


<style lang="scss">
    #question {
        position: relative;
        background-color: #EEE;
        padding: 1em;
        margin: 20px 0;
        border-radius: 1em;
        overflow: hidden;
        width: 75%;
        max-width: 80ch;
        display: inline-block;
        text-align: left;

        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: -20px;
            width: 0.4em;
            height: 150%;
        }
    }
    
    select {
        margin: 0.5em 0;
        font-size: 2em;
        font-weight: bold;
    }

    .question-text {
        font-weight: 500;
    }

    textarea {
        resize: vertical;
        width: 100%;
        max-width: 60ch;
        height: min-content;
        font-family: 'Ubuntu';
        font-size: 18px;
        font-weight: 500;
        outline: none;
        display: inline-block;

        &::-webkit-scrollbar {
            width: 7px;
        }

        &::-webkit-scrollbar-button {
            display: none;
        }

        &::-webkit-scrollbar-track {
            background: transparent;
        }

        &::-webkit-scrollbar-thumb {
            background: var(--green);
            width: 7px;
            border-radius: 7px;
        }

        &::-webkit-scrollbar-track-piece:start {
            margin-top: 0.2em;
            background: transparent;
        }

        &::-webkit-scrollbar-track-piece:end {
            margin-bottom: 0.2em;
            background: transparent;
        }
    }

    p {
        font-weight: 400;
        margin-bottom: 0.5em;
    }

    button {
        color: #EEE;
        background: var(--green);
        font-size: 20px;
        font-weight: bold;
        padding: 0.6em;
        margin: 1em 0 0.5em;
        border-radius: 0.6em;
        border: solid black 3px;
        cursor: pointer;
        box-sizing: border-box;
        width: 15ch;
    }

    .bio {
        &::before {
            background-color: #2C8250;
        }
    }

    .earth {
        &::before {
            background-color: #F5C13D;
        }
    }

    .chem {
        &::before {
            background-color: #D14444;
        }
    }

    .physics {
        &::before {
            background-color: #623e98;
        }
    }
    
    .math {
        &::before {
            background-color: #0061C2;
        }
    }
    
    .energy {
        &::before {
            background-color: #00EFEF;
        }
    }
</style>

    