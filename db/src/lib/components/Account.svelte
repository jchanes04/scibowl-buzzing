<script lang="ts">
    import { onMount } from "svelte";
    import { createEventDispatcher } from "svelte";
    import { session } from '$app/stores'
    import {goto} from "$app/navigation"
    import Cookie from 'js-cookie'
    import type {SaQuestion, McqQuestion, User} from 'src/mongo'
    export let userData : User
    export let questions : (SaQuestion|McqQuestion)[]

    const dispatch = createEventDispatcher()
</script>

<div>
    <div id="card">
        <img id="icon" src={`https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatarHash}.png`} alt="Profile" />
        <h2 id="username">{userData.username}</h2>
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
        {#if $session.userID==userData.id}
            <br />
            <button on:click={()=>{goto("/account")}}>Edit</button>
        {/if}
    </div>
</div>


<style lang="scss">
    h3 {
        margin-top: 1em;
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
        padding: 0.1em 0.3em;
        margin-bottom: 0;
        margin-top: 0.5em;

        @media (max-width: 600px) {
            text-align: center;
        }
    }

    #user-id {
        font-size: 16px;
        font-style: italic;

        @media (max-width: 600px) {
            text-align: center;
        }
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
        margin: auto;
        width: 80vw;
        max-width: 60em;
        min-height: 30em;
        margin-bottom: 50px;
        background-color: var(--color-6);
        border-radius: 2em;
        padding: 1em;
    }

    button {
        color: #EEE;
        background: var(--color-2);
        font-size: 20px;
        font-weight: bold;
        padding: 0.6em;
        border-radius: 0.6em;
        border: solid black 3px;
        cursor: pointer;
        min-width: 10ch;

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