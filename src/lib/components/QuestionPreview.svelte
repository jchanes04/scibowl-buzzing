<script lang="ts">
    import { goto } from "$app/navigation";
    import type { McqQuestion, SaQuestion } from "src/mongo";
    export let question: SaQuestion | McqQuestion
    $: truncatedQuestion = question.questionText.length > numCharacters ? question.questionText.slice(0, numCharacters) + "…" : question.questionText
    $: dateObject = new Date(question.date)
    $: dateString = dateObject.toDateString() + " " + dateObject.toTimeString().split(" ")[0]
    let previewWidth: number
    $: numCharacters = previewWidth / 3 - 20

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

<div class={"preview " + question.category} on:click={accessQuestion} bind:clientWidth={previewWidth}>
    <h2>{categoryNames[question.category]}</h2>
    <h3>{truncatedQuestion}</h3>       
    <p>Author - {question.authorName} <i>({dateString})</i></p>
</div>

<style lang="scss">
    .preview {
        cursor: pointer;
        position: relative;
        background-color: var(--med-gray);
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

    h3 {
        font-weight: 500;
    }

    p {
        font-weight: 400;
        margin-bottom: 0.5em;
    }

    .bio {
        &::before {
            background-color: var(--green);
        }
    }

    .earth {
        &::before {
            background-color: var(--orange);
        }
    }

    .chem {
        &::before {
            background-color: var(--red);
        }
    }

    .physics {
        &::before {
            background-color: var(--purple);
        }
    }
    
    .math {
        &::before {
            background-color: var(--blue);
        }
    }
    
    .energy {
        &::before {
            background-color: #00EFEF;
        }
    }
</style>