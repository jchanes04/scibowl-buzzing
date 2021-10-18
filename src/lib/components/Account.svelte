<script lang="ts">
    import { onMount } from "svelte";
    import Cookie from 'js-cookie'
    import { each } from "svelte/internal";
    import type {SaQuestion, McqQuestion} from 'src/mongo'
    import QuestionPreview from "./QuestionPreview.svelte";
    export let id : string
    let username : string
    let colors : string[]
    let questions : (SaQuestion | McqQuestion)[]
    let settings : {
        id : string, 
        username: string, 
        colors: string[], 
        questions: (SaQuestion | McqQuestion)[]
    }
    onMount(async ()=>{
        console.log(id)
        let res = await fetch("/api/user/" + id, {
            headers: {
                'Authorization': Cookie.get('authToken')
            }
            
        })
        settings = await res.json()
        colors = settings?.colors
        id = settings?.id
        questions = settings?.questions
        username = settings?.username
    })
    function handleChange () {
        settings.colors[0]
    }
</script>

<div>
    <h3>{username}</h3>
    <p>{id}<p>
    <h3>Color Scheme</h3>
    {#if colors}
        {#each colors as color}
            <input type="color" bind:value={colors} on:change={handleChange}>
            <label for="color">{color}</label>
        {/each}
    {/if}
    {#if questions}
        {#each questions as question}
            <QuestionPreview question={question}/>
        {/each}
    {/if}
</div>


<style lang="scss">
    input[type="color"] {
        width : 1.1em;
        height : 1em;
        
    }
</style>