<script lang="ts">
import { page } from "$app/stores";

    import { redirectTo } from "$lib/functions/redirectTo"; 

    import type { McqQuestion, SaQuestion } from "../../mongo";
    export let question: SaQuestion | McqQuestion
    export let answerVisible: boolean = false
    $: dateObject = new Date(question.date)
    $: dateString = dateObject.toDateString() + " " + dateObject.toTimeString().split(" ")[0]

    let categoryNames = {
        bio: "Biology",
        earth: "Earth and Space",
        chem: "Chemistry",
        physics: "Physics",
        math: "Math",
        energy: "Energy"
    }

    function showAnswer() {
        answerVisible = !answerVisible
    }


    function keyHandler(e: KeyboardEvent) {
        if (e.code === "Space"){
            showAnswer()
        }
    }   
</script>

<svelte:body on:keydown={keyHandler}></svelte:body>

<div id="question" class={question.category}>
    <h1>{categoryNames[question.category]}</h1>
    <h3 class="question-text">{question.questionText}</h3>     
          
    {#if question.type === "MCQ"}
        <h3 class="question-text">   W) {question.choices.W}</h3>
        <h3 class="question-text">   X) {question.choices.X}</h3>
        <h3 class="question-text">   Y) {question.choices.Y}</h3>
        <h3 class="question-text">   Z) {question.choices.Z}</h3>
    {/if}   
    <p>Author - {question.authorName} <i>({dateString})</i></p>
    <div id="button-wrapper">
        {#if answerVisible}
            <h3 id={"correct-answer"}>{question.correctAnswer}</h3> 
        {/if}
        <button id="showanswer" on:click={showAnswer}>{answerVisible ? "Hide" : "Show"} Answer</button>
        <a id="editbutton" href="/edit/{question.id}">
            <span />
        </a>
    </div>
    
</div>


<style lang="scss">

    #editbutton {
        position: absolute;
        right: 2em;
        bottom: 2em;
        background: var(--color-6);
        border-radius: 50%;
        font-size: inherit;
        outline: none;
        border: none;
        width: 2.5em;
        height: 2.5em;
        padding: 0.2em;
        vertical-align: middle;
        cursor: pointer;

        span {
            background-image: url('/pencil.png');
            background-size: cover;
            width: 100%;
            height: 100%;
            display: block;
        }

        &:disabled {
            cursor: default;
        }
    }

    h1 {
        margin-top: 0.5em;
    }

    .question-text {
        font-weight: 500;
    }

    #correct-answer {
        display: inline-block;
        text-decoration: underline;
        font-size: 20px;
    }

    p {
        font-weight: 400;
        margin-bottom: 0.5em;
    }

    #question {
        position: relative;
        background-color: var(--color-6);
        padding: 1em;
        margin: 20px;
        border-radius: 1em;
        overflow: hidden;
        width: 100%;
        max-width: min(100ch, 60vw);

        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: -20px;
            width: 0.4em;
            height: 150%;
        }

        @media (max-width: 800px) {
            max-width: min(100ch, 90vw);
        }
    }

    #showanswer {
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

    #button-wrapper {
        width: 20ch;
        display: inline-block;
        text-align: left;
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

    