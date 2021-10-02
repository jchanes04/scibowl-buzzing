<script lang="ts">
    import type { category } from "src/mongo";
    let author: string
    let type: "MCQ" | "SA"
    let category: category
    let optionW, optionX, optionY, optionZ: string
    let questionText,answer: string
    let correctAnswer: "W" | "X" | "Y" | "Z"
    $: submitEnabled = author && type && category && questionText && (answer || correctAnswer) && (type !== "MCQ" || (optionW && optionX && optionY && optionZ))
</script>

<svelte:head>
    <title>Submit Questions</title>
</svelte:head>

<form id="form" action="/write" method="POST" autocomplete="off">
    <h1>Submit Questions</h1>
    <input type="text" name="author" id="author-input" bind:value={author} />
    <div class="radio-wrapper">
        <label for="any-teams">
            <input id="any-teams" type="radio" name="type" value="MCQ" bind:group={type} />
            <span />
            Multiple Choice
        </label>
        <br />
        <label for="individual-teams">
            <input id="individual-teams" type="radio" name="type" value="SA" bind:group={type} />
            <span />
            Short Answer 
        </label>
    </div>
    <select name="category" id="category" bind:value={category}>
            <option value="" hidden default></option>
            <option value="earth">Earth and Space</option>
            <option value="bio">Biology</option>
            <option value="chem">Chemistry</option>
            <option value="physics">Physics</option>
            <option value="math">Math</option>
            <option value="energy">Energy</option>
    </select>
    <input type="text" placeholder="question" name="question-text" id="question-input" bind:value={questionText} />
    {#if type === "MCQ"}    
        <div class="radio-wrapper">
            <label>
                <input id="option-w-selected" type="radio" name="correct-answer" value="W" bind:group={correctAnswer} />
                <span />
                W)
                <input type="text" name="W" id="W-input" bind:value={optionW} />
            </label>
            <br />
            <label>
                <input id="option-x-selected" type="radio" name="correct-answer" value="X" bind:group={correctAnswer} />
                <span />
                X)
                <input type="text" name="X" id="X-input" bind:value={optionX} />
            </label>
            <br />
            <label>
                <input id="option-y-selected" type="radio" name="correct-answer" value="Y" bind:group={correctAnswer} />
                <span />
                Y)
                <input type="text" name="Y" id="Y-input" bind:value={optionY} />
            </label>
            <br />
            <label>
                <input id="option-z-selected" type="radio" name="correct-answer" value="Z" bind:group={correctAnswer} />
                <span />
                Z)
                <input type="text" name="Z" id="Z-input" bind:value={optionZ} />
            </label>          
        </div>
    {:else if type === "SA"}
        <input type="text" placeholder="answer" name="answer" id="answer-input" bind:value={answer} />
    {/if}
    <button type="submit" disabled={!submitEnabled}>Submit Question</button>
</form>

<style lang="scss">
    form {
        margin: 3em auto;
        border-radius: 1em;
        text-align: center;
        padding: 1em;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    h1 {
        font-size: 44px;
        text-decoration: underline var(--blue) 3px;
        text-underline-offset: 0.2em;
    }

    h2 {
        font-size: 24px;
        text-decoration: underline var(--blue) 2px;
        text-underline-offset: 0.1em;
    }

    .radio-wrapper {
        text-align: left;
        display: inline-block;
    }

    select {
        margin: 1em auto 0.5em;
        font-size: 18px;
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
        position: relative;

        &:focus::placeholder {
            color: transparent;
        }
    }

    label {
        cursor: pointer;
        padding-top: 0.3em;
        padding-bottom: 0.3em;
        display: inline-block;

        input[type="radio"] {
            visibility: hidden;
            width: 0;
            height: 0;
        }

        input[type="text"] {
            padding: 0.2em 0.5em;
            font-size: 20px;
            text-align: left;
            margin-left: 0.5em;
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
            border-color: var(--green);
        }

        input:checked ~ span::after {
            display: inline-block;
        }
    }

    button {
        padding: 0.5em;
        color: #EEE;
        background: var(--green);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 18px;
        cursor: pointer;
        margin-top: 1em;

        &:disabled {
            padding: calc(0.5em - 3px);
            border: solid var(--green) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }
    }
</style>