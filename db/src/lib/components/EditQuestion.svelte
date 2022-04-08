<script lang="ts">
    import type { category, McqQuestion, SaQuestion } from "$lib/mongo";
    export let question: SaQuestion | McqQuestion

    let textareaWidth: number 
    $: textareaHeight = Math.ceil((questionText.length + 12) * 24 / textareaWidth) * 18

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
            <label class="radio-label">
                <input id="option-w-selected" type="radio" name="correct-answer" value="W" bind:group={correctAnswer} />
                <span />
                <p>W)</p>
                <textarea class="choice" name="W" placeholder="Option W" id="W-input" bind:value={optionW} />
            </label>
            <br />
            <label class="radio-label">
                <input id="option-x-selected" type="radio" name="correct-answer" value="X" bind:group={correctAnswer} />
                <span />
                <p>X)</p>
                <textarea class="choice" name="X" placeholder="Option X" id="X-input" bind:value={optionX} />
            </label>
            <br />
            <label class="radio-label">
                <input id="option-y-selected" type="radio" name="correct-answer" value="Y" bind:group={correctAnswer} />
                <span />
                <p>Y)</p>
                <textarea class="choice" name="Y" placeholder="Option Y" id="Y-input" bind:value={optionY} />
            </label>
            <br />
            <label class="radio-label">
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
        background-color: var(--color-6);
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
    
    .radio-label {
        cursor: pointer;
        padding-top: 0.3em;
        padding-bottom: 0.3em;
        display: inline-block;
        font-size: 20px;
        vertical-align: middle;

        input[type="radio"] {
            visibility: hidden;
            width: 0;
            height: 0;
        }

        .choice {
            width: 40ch;
            height: 3em;
            min-height: 3em;
        }

        p {
            width: 2.5ch;
            margin: 0;
            display: inline-block;
        }

        span {
            width: 1em;
            height: 1em;
            border-radius: 50%;
            border: #CCC 2px solid;
            display: inline-block;
            position: relative;
            background: #FFF;
            vertical-align: text-top;
            margin-right: 0.3em;

            &::after {
                content: '';
                position: absolute;
                display: none;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 0.7em;
                height: 0.7em;
                border-radius: 0.35em;
                background: var(--blue);
            }
        }

        &:hover > span {
            border-color: var(--color-2);
        }

        input:checked ~ span::after {
            display: inline-block;
        }
    }

    .checkbox-label {
        cursor: pointer;
        padding-top: 0.3em;
        padding-bottom: 0.3em;
        font-size: 20px;
        display: inline-block;

        input[type="checkbox"] {
            visibility: hidden;
            width: 0;
            height: 0;
        }

        span {
            width: 1em;
            height: 1em;
            border-radius: 0.2em;
            display: inline-block;
            position: relative;
            background: var(--color-3);
            vertical-align: text-top;
            margin-right: 0.3em;

            &::after {
                content: '';
                position: absolute;
                display: none;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 0.65em;
                height: 0.65em;
                border-radius: 0.1em;
                background: var(--blue);
            }
        }

        &:hover > span {
            border-color: var(--color-2);
        }

        input:checked ~ span::after {
            display: inline-block;
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
            background: var(--color-2);
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
    
    select {
        padding: 0.3em;
        font-size: 24px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        width: 25ch;
        max-width: 80vw;
        text-align: center;
        font-family: 'Ubuntu';
        position: relative;
    }

    input[type="text"] {
        padding: 0.3em;
        font-size: 24px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        width: 25ch;
        max-width: 80vw;
        text-align: center;
        font-family: 'Ubuntu';
        position: relative;

        &:focus::placeholder {
            color: transparent;
        }
    }

    textarea {
        padding: 0.3em;
        font-size: 20px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        width: 30em;
        max-width: 80vw;
        resize: vertical;
        min-height: 1.8em;
        height: 1.8em;
        font-family: 'Ubuntu';
        position: relative;
        vertical-align: middle;

        &:focus::placeholder {
            color: transparent;
        }
    }

    p {
        font-weight: 400;
        margin-bottom: 0.5em;
    }

    button {
        color: #EEE;
        background: var(--color-2);
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
            background-color: var(--bio);
        }
    }

    .earth {
        &::before {
            background-color: var(--earth);
        }
    }

    .chem {
        &::before {
            background-color: var(--chem);
        }
    }

    .physics {
        &::before {
            background-color: var(--physics);
        }
    }
    
    .math {
        &::before {
            background-color: var(--math);
        }
    }
    
    .energy {
        &::before {
            background-color: var(--energy);
        }
    }
</style>

    