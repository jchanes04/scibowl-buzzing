<script lang="ts">
    import { onMount} from "svelte";
    import { createEventDispatcher } from "svelte";
    import { session } from '$app/stores'
    import {goto} from "$app/navigation"
    import Cookie from 'js-cookie'
    import type {SaQuestion, McqQuestion, User} from 'src/mongo'
    import QuestionPreview from "./QuestionPreview.svelte";
    import Question from "./Question.svelte";
    export let userData : User
    export let questions : (SaQuestion|McqQuestion)[]

    const dispatch = createEventDispatcher()
</script>

<div>
    <div id="card">
        <div id="icon"></div>
        <h3>{userData.username}</h3>
        <p>{userData.id}<p>
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
            <button on:click={()=>{goto("/account")}}>Edit</button>
        {/if}
    </div>
</div>


<style lang="scss">
    h3{
        margin:0;
        font-size: xx-large;
    }
    p{
        font-size: x-large;
        margin-top: .4em;
        margin-bottom: 1em;
    }
    #color {
        width: 2em;
        height: 2em;
        border-radius: 1.5em;
    }
    #icon{
        width:10em;
        height:10em;
        position: absolute;
        display: block;
        right: 1em;
        border-radius: 2.5em;
        background-image: url("https://cdn.discordapp.com/avatars/453297392608083999/297d47dc844b600551f91a0d602bf4c5.webp?size=160");
    }
    #card {
        position: relative;
        margin:auto;
        width: 60em;
        height: 30em;
        margin-bottom: 50px;
        background-color: #eee;
        border-radius: 2em;
        padding: 1em;
    }
</style>