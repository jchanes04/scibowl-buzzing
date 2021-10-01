<script lang="ts">
    import { session } from "$app/stores"
    let type
    let category
    let W,X,Y,Z
    let question,answer
    let newTeamName
    $: submitEnabled = type && category && question && answer && (type !== "MCQ" || (W && X && Y && Z))

    import TeamList from '$lib/components/TeamList.svelte'

    function handleSubmit() {
        teams = [...teams, newTeamName]
        newTeamName = ''
        $session.memberName = ownerName
    }
</script>

<svelte:head>
    <title>Create Game</title>
</svelte:head>

<form id="form" action="/create" method="POST" autocomplete="off" on:submit={handleSubmit}>
    <h1>Submit Questions</h1>
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
        <br />
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
    <br />
    <br />
    <input type="text" placeholder="question" name="question" id="question-input" bind:value={question} />
    <br />
    {#if type === "MCQ"}
        <p>W) </p>
        <input type="text" placeholder="W" name="W" id="W-input" bind:value={W} />
        <br />
        <p>X) </p>
        <input type="text" placeholder="X" name="X" id="X-input" bind:value={X} />
        <br />
        <p>Y) </p>
        <input type="text" placeholder="Y" name="Y" id="Y-input" bind:value={Y} />
        <br />
        <p>Z) </p>
        <input type="text" placeholder="Z" name="Z" id="Z-input" bind:value={Z} />
        <br />
    {/if}
    <br />
    <input type="text" placeholder="answer" name="answer" id="answer-input" bind:value={answer} />
    <br />
    <button type="submit" disabled={!submitEnabled}>Submit Question</button>
</form>

<style lang="scss">
    form {
        margin: 3em auto;
        border-radius: 1em;
        text-align: center;
        padding: 1em;
        position: relative;
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

        input {
            visibility: hidden;
            width: 0;
            height: 0;
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

        &:disabled {
            padding: calc(0.5em - 3px);
            border: solid var(--green) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }
    }
</style>