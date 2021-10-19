<script lang="ts">
    import { onMount } from "svelte";
    import Cookie from 'js-cookie'
    import type {SaQuestion, McqQuestion, User, UserSettings} from 'src/mongo'
    import QuestionPreview from "./QuestionPreview.svelte";

    export let userData: User
    export let userSettings: UserSettings
    export let questions: (SaQuestion|McqQuestion)[]

    onMount(()=>{
        userSettings.colors = ["#EEEEEE","#AABBCC"]
    })
    function handleChange () {
        console.dir(userSettings.colors)
    }
</script>

<div>
    <div id="card">
        <div id="icon"></div>
        <input type="" bind:value={userData.username} />
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
        <h3>Color Scheme</h3>
        {#if userSettings.colors}
            {#each userSettings.colors as color}
                <input type="color" bind:value={color} on:change={handleChange} />
                <input type="text" bind:value={color} /> <br />
            {/each}
        {/if}
        <button>Submit</button>
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
    input[type="color"] {
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
        min-height: 30em;
        margin-bottom: 50px;
        background-color: #eee;
        border-radius: 2em;
        padding: 1em;
    }
</style>