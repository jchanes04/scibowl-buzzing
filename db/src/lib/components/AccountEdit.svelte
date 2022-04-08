<script lang="ts">
    import type {SaQuestion, McqQuestion, User, UserSettings} from '$lib/mongo'
    import { createEventDispatcher } from 'svelte';

    export let userData: User
    export let userSettings: UserSettings
    export let questions: (SaQuestion|McqQuestion)[]

    const usernameRegex = /[\S]+/

    let inputtedUsername: string = userData.username
    let inputtedColors: string[] = [
        ...(userSettings.colors || ["#EEEEEE","#AABBCC"])
    ]
    $: validChanges = usernameRegex.test(inputtedUsername)

    async function submitChanges() {
        const reqBody = new URLSearchParams({
            username: inputtedUsername
        })

        const res = await fetch('/api/account', {
            method: 'POST',
            body: reqBody
        })
        const resBody = await res.json()
        if (resBody.user?.username) {
            userData.username = resBody.user.username
            inputtedUsername = resBody.user.username
            questions = questions.map(q => ({ ...q, authorName: resBody.user.username }))
        }
    }

</script>

<div>
    <div id="card">
        <img id="icon" src={`https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatarHash}.png`} alt="Profile" />
        <input id="username" type="text" bind:value={inputtedUsername} />
        <p id="user-id">{userData.id}<p>
        {#if questions}
            <h3>Question Record</h3>
            <p>Total: {questions.length}</p>
            <p>Biology: {questions.filter(question => question.category=="bio").length}</p>
            <p>Chemistry: {questions.filter(question => question.category=="chem").length}</p>
            <p>Earth and Space: {questions.filter(question => question.category=="earth").length}</p>
            <p>Physics: {questions.filter(question => question.category=="physics").length}</p>
            <p>Math: {questions.filter(question => question.category=="math").length}</p>
        {/if}
        <!-- <h3>Color Scheme</h3>
        {#if inputtedColors}
            {#each inputtedColors as color}
                <input type="color" bind:value={color} />
                <input class="color-input" type="text" bind:value={color} /> <br />
            {/each}
        {/if} -->
        <button id="save-changes" disabled={!validChanges} on:click={submitChanges}> Save Changes</button>
    </div>
</div>


<style lang="scss">
    h3 {
        margin-top:1em;
        margin-bottom: 0.2em;
        font-size: 30px;
    }

    p {
        font-size: 24px;
        margin-top: 0.4em;
        margin-bottom: 0.4em;
    }

    #username {
        font-size: 40px;
        width: 20ch;
        padding: 0.1em 0.3em;
        margin-bottom: 0;
        max-width: calc((100% - 3em) / 1.2);

        @media (max-width: 600px) {
            display: block;
            margin-left: auto;
            margin-right: auto;
            min-width: 10ch;
            max-width: calc((100% - 1em) / 1.2);
        }
    }

    #user-id {
        font-size: 16px;
        font-style: italic;

        @media (max-width: 600px) {
            text-align: center;
        }
    }

    input[type="color"] {
        width: 2em;
        height: 2em;
        border-radius: 1.5em;
        border: none;
        vertical-align: middle;
    }

    input[type="text"] {
        font-size: 20px;
        padding: 0.3em;
        margin: 0.5em 0;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
    }

    .color-input {
        width: 10ch;
    }

    #icon {
        width:10em;
        height:10em;
        position: absolute;
        display: block;
        right: 1em;
        border-radius: 2.5em;
        // background-image: url("https://cdn.discordapp.com/avatars/453297392608083999/297d47dc844b600551f91a0d602bf4c5.webp?size=160");
    
        @media(max-width: 600px) {
            position: static;
            margin: 1em auto;
        }
    }

    #card {
        position: relative;
        margin:auto;
        width: 80vw;
        max-width: 60em;
        min-height: 30em;
        margin-bottom: 50px;
        background-color: var(--color-6);
        border-radius: 2em;
        padding: 1em;
    }

    #save-changes {
        position: absolute;
        right: 1em;
        bottom: 1em;
        color: #EEE;
        background: var(--color-2);
        font-size: 20px;
        font-weight: bold;
        padding: 0.6em;
        border-radius: 0.6em;
        border: solid black 3px;
        cursor: pointer;

        &:disabled {
            border: solid var(--color-2) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }

        @media (max-width: 600px) {
            position: static;
            display: block;
            margin: 1em auto 0.5em;
            width: 80%;
        }
    }
</style>