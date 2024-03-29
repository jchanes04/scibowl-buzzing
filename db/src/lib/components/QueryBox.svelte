<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { category } from "$lib/mongo";
    import Cookie from 'js-cookie'
    import { page } from "$app/stores";

    let inputs: {
        authorName :string
        keywords : string
        start : string
        end : string
        types : ("MCQ" | "SA")[] 
        categories : category[] 
    }
    export let numQuestions : number
    const dispatch = createEventDispatcher()
    let authorName: string, keywords: string, start: string, end: string
    let types: ("MCQ" | "SA")[] = []
    let categories: category[] = []
    $:inputs = {authorName, keywords, start, end, types, categories}
    async function emitQuery(pageNumber: number = 1) {
        dispatch('sendQuery', {
            inputs:inputs,
            pageNumber
        })
        Cookie.set('lastQuery', JSON.stringify(inputs),{path:"",expires:.01})
    }
</script>

<svelte:body on:keydown={(e) => {
    if (e.code === "Enter" && $page.url.pathname.startsWith("/question/")) {
        dispatch('sendQuery', {
            inputs:inputs
        })
    }
}}></svelte:body>

<form id="query" on:submit={(e) => {
    e.preventDefault()
}}>
    <h2>Make a Query</h2>
    <div style="display: inline-block; text-align: left;">
        <input type="text" name="author-name" placeholder="Author" id="author-input" bind:value={authorName} /><br />
        <input type="text" name="keywords" placeholder="Keywords" id="keyword-input" bind:value={keywords} /><br />
        <h3>Start Date:</h3><input type="date" name="start-date" bind:value={start}><br />
        <h3>End Date:</h3><input type="date" name="end-date" bind:value={end}>
    </div>
    <div class="radio-wrapper">
        <h3>Type</h3>
        <label for="multiple-choice">
            <input id="multiple-choice" type="checkbox" name="type" value="MCQ" bind:group={types} />
            <span />
            Multiple Choice
        </label>
        <br />
        <label for="short-answer">
            <input id="short-answer" type="checkbox" name="type" value="SA" bind:group={types} />
            <span />
            Short Answer 
        </label>
    </div>
    <br />
    <div class="checkbox-wrapper">
        <h3>Categories</h3>                
        <label for="bio">
            <input type="checkbox" id="bio" name="category" value="bio" bind:group={categories} />
            <span />
            Biology
        </label> <br />
        <label for="earth">
            <input type="checkbox" id="earth" name="category" value="earth" bind:group={categories} />
            <span />
            Earth and Space
        </label> <br />
        <label for="chem">
            <input type="checkbox" id="chem" name="category" value="chem" bind:group={categories} />
            <span />
            Chemistry
        </label> <br />
        <label for="physics">
            <input type="checkbox" id="physics" name="category" value="physics" bind:group={categories} />
            <span />
            Physics
        </label> <br />
        <label for="math">
            <input type="checkbox" id="math" name="category" value="math" bind:group={categories} />
            <span />
            Math
        </label> <br />
        <label for="energy">
            <input type="checkbox" id="energy" name="category" value="energy" bind:group={categories} />
            <span />
            Energy  
        </label> <br /> 
    </div>
    <br />            
    <button on:click={() => emitQuery()}>Submit Query</button>
    {#if numQuestions}
        <h3>{numQuestions} questions matched your query</h3>
    {/if}
</form>
<style lang="scss">
    #query {
        display: flex;
        flex-direction: column;
        padding: 1em;
    }
    input[type="date"] {
        padding: 0.3em;
        font-size: 20px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        max-width: min(80vw, 90%);
        text-align: left;
        position: relative;
        &:focus::placeholder {
            color: transparent;
        }
    }
    input[type="text"] {
        padding: 0.3em;
        font-size: 20px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        max-width: 80%;
        text-align: left;
        font-family: 'Ubuntu';
        position: relative;
        &:focus::placeholder {
            color: transparent;
        }
    }
    h3 {
        margin-top: 0.5em;
        margin-bottom: 0.5em;
    }
    
    .checkbox-wrapper {
        text-align: left;
        display: inline-block;
    }
    label {
        cursor: pointer;
        padding-top: 0.3em;
        padding-bottom: 0.3em;
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
            border: #CCC 0px solid;
            display: inline-block;
            position: relative;
            background: var(--color-3);
            vertical-align: text-top;
            margin-right: 0.3em;
            &::after {
                content: '';
                position: absolute;
                display: none;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 0.6em;
                height: 0.6em;
                border-radius: 0.1em;
                background: var(--blue);
            }
        }
        &:hover > span {
            border-color: var(--color-2);
        }
        input:checked ~ span::after {
            display: inline-block;
        }
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
        max-width: 35ch;
    }
</style>