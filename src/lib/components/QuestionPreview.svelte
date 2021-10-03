<script lang="ts">
    import { goto } from "$app/navigation";
    import type { McqQuestion, SaQuestion } from "src/mongo";
    export let question: SaQuestion | McqQuestion
    $: truncatedQuestion = question.questionText.length > 70 ? question.questionText.slice(0, 70) + "…" : question.questionText
    $: dateObject = new Date(question.date)
    $: dateString = dateObject.toDateString() + " " + dateObject.getHours() + ":" + dateObject.getMinutes() + ":" + dateObject.getSeconds()

    let categoryNames = {
        bio: "Biology",
        earth: "Earth and Space",
        chem: "Chemistry",
        physics: "Physics",
        math: "Math",
        energy: "Energy"
    }

    function accessQuestion() {
        goto("/question/"+question.id)
    }
</script>

<div id="preview" class={question.category} on:click={accessQuestion}>
    <h2>{categoryNames[question.category]}</h2>
    <h3>{truncatedQuestion}</h3>       
    <p>Author - {question.author} ({dateString})</p>
</div>

<style lang="scss">
    #preview {
        cursor: pointer;
        position: relative;
        background-color: #EEE;
        padding: 1em;
        border-radius: 1em;
        overflow: hidden;

        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: -20px;
            width: 0.3em;
            height: 150%;
        }

        &:hover {
            transform: scale(1.03);
            transition: transform 0.07s ;
        }
    }

    p {
        font-weight: 400;
        font-style: italic;
        margin-bottom: 0.5em;
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