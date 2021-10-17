<script lang="ts">
    import type { McqQuestion, SaQuestion } from "src/mongo";
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
        <button on:click={showAnswer}>{answerVisible ? "Hide" : "Show"} Answer</button>
    </div>
    {#if answerVisible}
        <h3 id={"correct-answer"}>{question.correctAnswer}</h3> 
    {/if}
</div>


<style lang="scss">
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
        background-color: #EEE;
        padding: 1em;
        margin: 20px;
        border-radius: 1em;
        overflow: hidden;
        width: 100%;
        max-width: 100ch;

        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: -20px;
            width: 0.4em;
            height: 150%;
        }
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

    #button-wrapper {
        width: 20ch;
        display: inline-block;
        text-align: left;
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

    