<script lang="ts">
    import type { McqQuestion, SaQuestion } from "src/mongo";
    export let question: SaQuestion | McqQuestion
    $: dateString = (new Date(question.date)).toString()

    let answerVisible = false
    function showAnswer() {
        answerVisible = !answerVisible
    }
</script>


<div id={question.id}>
    <h1>{question.category}</h1>
    <h3>{question.questionText}</h3>     
          
    {#if question.type === "MCQ"}
        <h3>   W) {question.choices.W}</h3>
        <h3>   X) {question.choices.X}</h3>
        <h3>   Y) {question.choices.Y}</h3>
        <h3>   Z) {question.choices.Z}</h3>
    {/if}   
    <p>Author - {question.author} ({dateString})</p>
    <button on:click={showAnswer}>Show Answer</button>
    {#if answerVisible}
        <h3 id={question.id+"-answer"}>Answer: {question.correctAnswer}</h3> 
    {/if}   
</div>


<style lang="scss">
    p {
        color: #333;
        font-style: italic;
    }

</style>

    