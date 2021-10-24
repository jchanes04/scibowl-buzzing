<script lang="ts">
    import type { category } from "src/mongo";
    import { page, session } from '$app/stores'
    import DatabaseHeader from "$lib/components/DatabaseHeader.svelte";
import { HOST_URL } from "$lib/variables";
    let ownQuestion: boolean = true
    let author: string
    let type: "MCQ" | "SA"
    let category: category
    let optionW, optionX, optionY, optionZ: string
    let questionText,answer: string
    let correctAnswer: "W" | "X" | "Y" | "Z"
    $: submitEnabled = (author || ownQuestion) && type && category && questionText && (answer || correctAnswer) && (type !== "MCQ" || (optionW && optionX && optionY && optionZ))
</script>

<svelte:head>
    <title>Submit Questions</title>
</svelte:head>

<main>
    <DatabaseHeader>
        {#if $session.isLoggedIn}
            <h1 style="margin: 0;">{$session.userData?.username}</h1>
        {:else}
            <a href={`https://discord.com/api/oauth2/authorize?client_id=895468421054083112&redirect_uri=http%3A%2F%2F${encodeURIComponent(HOST_URL)}%2Fauth%2Fwrite&response_type=code&scope=identify`}>
                <button id="login-button">Login</button>
            </a>
        {/if}
    </DatabaseHeader>
    <form id="form" action="/write" method="POST" autocomplete="off">
        <h1>Submit Questions</h1>
        <input type="hidden" name="user-id" value={$session.userID} />
        {#if $session.isLoggedIn}
            <label for="own-question" class="checkbox-label">
                <input id="own-question" type="checkbox" name="own-question" bind:checked={ownQuestion} />
                <span />    
                This is my own question
            </label>
            
            {#if !ownQuestion}
                <input type="text" name="author-name" placeholder="Author" id="author-input" bind:value={author} />
            {/if}
        {:else}
            <input type="text" name="author-name" placeholder="Author" id="author-input" bind:value={author} />
        {/if}
        
        <div class="radio-wrapper">
            <label for="multiple-choice" class="radio-label">
                <input id="multiple-choice" type="radio" name="type" value="MCQ" bind:group={type} />
                <span />
                Multiple Choice
            </label>
            <br />
            <label for="short-answer" class="radio-label">
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
            <input type="text" name="answer" placeholder="Answer" id="answer-input" bind:value={answer} />
        {/if}
        <button type="submit" disabled={!submitEnabled}>Submit Question</button>
    </form>
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
            border-color: var(--green);
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
                border-radius: 0.1em;
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

    #login-button {
        color: #EEE;
        background: var(--green);
        font-size: 20px;
        font-weight: bold;
        padding: 0.6em;
        border-radius: 0.6em;
        border: solid black 3px;
        cursor: pointer;
        margin-top: 0;
    }

    button {
        padding: 0.5em;
        color: #EEE;
        background: var(--green);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 30px;
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