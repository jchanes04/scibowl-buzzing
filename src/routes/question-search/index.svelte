<script lang="ts">
    import QuestionPreview from "$lib/components/QuestionPreview.svelte";
    import PageSwitcher from "$lib/components/PageSwitcher.svelte";
    import type { category } from "src/mongo";
    import type {SaQuestion, McqQuestion} from 'src/mongo'
    import Cookie from 'js-cookie'
    import {onMount, tick} from 'svelte'
    import DatabaseHeader from "$lib/components/DatabaseHeader.svelte";
    import { page } from "$app/stores";

    let questions: (SaQuestion | McqQuestion)[] = []
    let pageNumber = 1
    let resultsPerPage = 20
    $: numPages = Math.ceil(questions.length / resultsPerPage)

    let author: string
    let keywords: string
    let types: ("MCQ" | "SA")[] = []
    let categories: category[] = []
    let start,end

    $: console.log(types)

    onMount(async ()=>{
        let stored = Cookie.get('lastQuery')? JSON.parse(Cookie.get('lastQuery')) : undefined
        if (stored) {
            author = stored.author
            types = stored.types ? stored.types.split(',') : [] 
            categories = stored.categories ? stored.categories.split(",") : []
            start = stored.start ? stored.start : undefined
            end = stored.end ? stored.end : undefined
            await sendQuery()
        }
    })
    async function sendQuery() {
        let inputs: Record<string, string> = {}
        if (author) inputs.author = author
        if (keywords) inputs.keywords = keywords
        if (types.length) inputs.types = types.join(",")
        if (categories.length) inputs.categories = categories.join(",")
        if (start) inputs.start = start
        if (end) inputs.end = end 
        Cookie.set('lastQuery', JSON.stringify(inputs),{path:"",expires:.01})
        let params = new URLSearchParams(inputs)
        let res = await fetch("/api/questions?" + params.toString())
        questions = await res.json()
        console.log(questions)
        await tick()
        window.scroll(0, 0)
    }
</script>

<main>
    <DatabaseHeader />
    <div id="page">
        <form id="query" on:submit={(e) => {
            e.preventDefault()
        }}>
            <h2>Make a Query</h2>
            <div style="display: inline-block; text-allign: left;">
                <input type="text" name="author" placeholder="Author" id="author-input" bind:value={author} /><br />
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
            <button on:click={sendQuery}>Submit Query</button>
            {#if questions.length}
                <h3>{questions.length} questions matched your query</h3>
            {/if}
        </form>
        <div id="results">
            {#if questions.length}
                <div id="questions">
                    {#each questions as q, i}
                        {#if (i >= (pageNumber - 1) * resultsPerPage && i < pageNumber * resultsPerPage)}
                            <QuestionPreview question={q}/>
                        {/if}
                    {/each}
                </div>
                <PageSwitcher bind:numPages={numPages} bind:pageNumber={pageNumber} on:pageChange={() => {window.scroll(0, 0)}} />
            {/if}
        </div>
        
    </div>
</main>

<style lang="scss">
    #page {
        display: flex;
        flex-direction: row;
    }
    

    input[type="date"] {
        padding: 0.3em;
        font-size: 20px;
        margin: 0.5em auto;
        border: none;
        border-radius: 0.3em;
        box-sizing: border-box;
        max-width: 80vw;
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
    

    #query {
        display: flex;
        position: sticky;
        flex-direction: column;
        margin: 20px;
        top: 50px;
        padding: 1em;
        height: 100%;
        background-color: #EEE;
        border-radius: 1em;

        @media (min-width: 600px) {
            width: 25vw;
        }
    }

    #questions {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        row-gap: 20px;
        column-gap: 20px;
       
    }

    #results {
        margin: 20px;
        height: 100%;

        @media (min-width: 600px) {
            width: 75vw;
        }
    }

    .checkbox-wrapper {
        text-align: left;
        display: inline-block;
    }
    
    button {
        color: #EEE;
        background: var(--green);
        font-size: 20px;
        font-weight: bold;
        padding: 0.6em;
        border-radius: 0.6em;
        border: solid black 3px;
        cursor: pointer;
    }
</style>