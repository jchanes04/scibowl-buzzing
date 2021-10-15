<script lang="ts">
    import type { category } from "src/mongo";
    import type {SaQuestion, McqQuestion} from 'src/mongo'
    import { session } from '$app/stores'
    import { onMount } from 'svelte';
    import { page } from '$app/stores'
    import Cookie from 'js-cookie'
    import NotLoggedIn from "$lib/components/NotLoggedIn.svelte";
    import NotAuthorized from "$lib/components/NotAuthorized.svelte";
    import DatabaseHeader from "$lib/components/DatabaseHeader.svelte";
    let type: "MCQ" | "SA"
    let category: category
    let optionW: string, optionX: string, optionY: string, optionZ: string
    let questionText: string, answer: string
    let correctAnswer: "W" | "X" | "Y" | "Z"
    let authorId: string
    $: submitEnabled = type && category && questionText && (answer || correctAnswer) && (type !== "MCQ" || (optionW && optionX && optionY && optionZ))

    onMount(async () => {
        let res = await fetch("/api/question/" + $page.params.id, {
            headers: {
                'Authorization': Cookie.get('authToken')
            }
        })
        let question = <McqQuestion | SaQuestion>await res.json();
        ({authorId, type, questionText, category} = question)
        if (question.type === "MCQ"){
            optionW = question.choices.W
            optionX = question.choices.X
            optionY = question.choices.Y
            optionZ = question.choices.Z
            correctAnswer = question.correctAnswer
        } else {
            answer = question.correctAnswer
        }        
    })


</script>

<svelte:head>
    <title>Edit Question</title>
</svelte:head>
<main>
    <DatabaseHeader>
        {#if $session.isLoggedIn}
            <h1 style="margin: 0;">{$session.userData?.username}</h1>
        {:else}
            <a href="https://discord.com/api/oauth2/authorize?client_id=895468421054083112&redirect_uri=http%3A%2F%2F45.32.217.67%2Fauth%2Fedit&response_type=code&scope=identify">
                <button>Login</button>
            </a>
        {/if}
    </DatabaseHeader>

    {#if !$session.isLoggedIn}
        <NotLoggedIn page="edit"/>
    {:else if $session.userID !== authorId}
        <NotAuthorized page="edit" />
    {:else}
        <form id="form" action="/edit" method="POST" autocomplete="off">
            <input type="hidden" name="user-id" value={$session.userID} />
            <h1>Edit Question</h1>
            <div class="radio-wrapper">
                <label for="multiple-choice">
                    <input id="multiple-choice" type="radio" name="type" value="MCQ" bind:group={type} />
                    <span />
                    Multiple Choice
                </label>
                <br />
                <label for="short-answer">
                    <input id="short-answer" type="radio" name="type" value="SA" bind:group={type} />
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
            <textarea name="question-text" placeholder="Question" id="question-input" bind:value={questionText} style="height: 4em; min-height: 4em;" />
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
                <input type="text" name="answer" placeholder="Answer" id="answer-input" bind:value={answer} />
            {/if}
            <button type="submit" disabled={!submitEnabled}>Submit Question</button>
        </form>
    {/if}
</main>

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
        width: 40ch;
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

    label {
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