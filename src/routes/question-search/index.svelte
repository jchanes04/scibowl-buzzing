<script lang="ts">
    import QuestionPreview from "$lib/components/QuestionPreview.svelte";
    import PageSwitcher from "$lib/components/PageSwitcher.svelte";
    import type { category } from "src/mongo";
    import type {SaQuestion, McqQuestion} from 'src/mongo'
    import Cookie from 'js-cookie'
    import {onMount, tick} from 'svelte'
    import DatabaseHeader from "$lib/components/DatabaseHeader.svelte";
    import NotLoggedIn from "$lib/components/NotLoggedIn.svelte";
    import NotAuthorized from "$lib/components/NotAuthorized.svelte";
    import { session } from '$app/stores'

    let questions: (SaQuestion | McqQuestion)[] = []
    let pageNumber = 1
    let resultsPerPage = 20
    $: numPages = Math.ceil(questions.length / resultsPerPage)

    let authorName: string
    let keywords: string
    let types: ("MCQ" | "SA")[] = []
    let categories: category[] = []
    let start,end
    let menuOpen = true

    onMount(async ()=>{
        let stored = Cookie.get('lastQuery')? JSON.parse(Cookie.get('lastQuery')) : undefined
        if (stored) {
            authorName = stored.author
            types = stored.types ? stored.types.split(',') : [] 
            categories = stored.categories ? stored.categories.split(",") : []
            start = stored.start ? stored.start : undefined
            end = stored.end ? stored.end : undefined
            await sendQuery()
        }
        
        console.log("Session: ")
        console.dir($session)
    })

    async function sendQuery() {
        let inputs: Record<string, string> = {}
        if (authorName) inputs.authorName = authorName
        if (keywords) inputs.keywords = keywords
        if (types.length) inputs.types = types.join(",")
        if (categories.length) inputs.categories = categories.join(",")
        if (start) inputs.start = start
        if (end) inputs.end = end 
        Cookie.set('lastQuery', JSON.stringify(inputs),{path:"",expires:.01})
        let params = new URLSearchParams(inputs)
        let res = await fetch("/api/questions?" + params.toString(), {
            headers: {
                'Authorization': Cookie.get('authToken')
            }
        })
        if (res.status === 401){
            $session.isLoggedIn=false
        } else {
            questions = await res.json()
            await tick()
            window.scroll(0, 0)
            closeMenu()
        }
    }

    function openMenu() {
        menuOpen = true
    }

    function closeMenu() {
        menuOpen = false
    }
</script>

<main>
    {#if $session.userData}
        <DatabaseHeader>
            {#if $session.isLoggedIn}
                <h1 style="margin: 0;">{$session.userData?.username}</h1>
            {:else}
                <a href="https://discord.com/api/oauth2/authorize?client_id=895468421054083112&redirect_uri=http%3A%2F%2F45.32.217.67%2Fauth%2Fquestion-search&response_type=code&scope=identify">
                    <button>Login</button>
                </a>
            {/if}
        </DatabaseHeader>
        {#if $session.isLoggedIn}
            {#if $session.userData?.username}
                <div id="page">
                    <div id="query-container" class:open={menuOpen}>
                        <div id="query-container-2">
                            <form id="query" on:submit={(e) => {
                                e.preventDefault()
                            }}>
                                <span id="close-menu" on:click={closeMenu}><span /></span>

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
                                <button on:click={sendQuery}>Submit Query</button>
                                {#if questions.length}
                                    <h3>{questions.length} questions matched your query</h3>
                                {/if}
                            </form>
                        </div>
                    </div>
                    <div id="open-menu" class:opened={menuOpen} on:click={openMenu}>
                        <span><span /></span>
                    </div>
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
                        {:else}
                            <div id="no-results">
                                <h1>No Questions Found</h1>
                                <div id="bensive"></div>
                            </div>
                        {/if}
                    </div>
                    
                </div>
            {:else}
                <NotAuthorized page="question-search" />
            {/if}
        {:else}
            <NotLoggedIn page="question-search" />
        {/if}
    {/if}
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
        background-color: #EEE;
        border-radius: 1em;

        @media (min-width: 800px) {
            width: 25vw;
        }
    }

    #close-menu {
        display: none;       
    }

    #open-menu {
        display: none;
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

        @media (min-width: 800px) {
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

    #no-results {
        text-align: center;
        font-size: 30px;
    }

    #bensive {
        background: url('/bensive.svg');
        background-size: cover;
        width: 25vw;
        height: 25vw;
        max-width: 25em;
        max-height: 25em;
        margin: 1em 3em;
        display: inline-block;
        opacity: 0.7;
    }
    
    @media (max-width: 800px) {
        
        #query-container {
            position: fixed;
            z-index: 5;
            top: 0;
            right: 110vw;
            width: 100vw;
            height: 100vh;
            background: #d4d9d9;
            transition: right 0.4s ease-in-out;
            overflow: visible;

            &.open {
                right: 0vw;
            }
        }

        #query-container-2 {
            height: 100vh;
            overflow: auto;
            margin-right: 10px;
            overscroll-behavior: contain;

            &::-webkit-scrollbar {
                width: 7px;
            }

            &::-webkit-scrollbar-button {
                display: none;
            }

            &::-webkit-scrollbar-track {
                background: transparent;
            }

            &::-webkit-scrollbar-thumb {
                background: var(--green);
                width: 7px;
                border-radius: 7px;
            }

            &::-webkit-scrollbar-track-piece:start {
                margin-top: 0.2em;
                background: transparent;
            }

            &::-webkit-scrollbar-track-piece:end {
                margin-bottom: 0.2em;
                background: transparent;
            }
        }

        #query {
            position: relative;
            margin-bottom: 20vh;
        }

        #close-menu {
            display: block;
            width: 40px;
            height: 40px;
            background: #EEE;
            border-radius: 50%;
            position: absolute;
            top: 30px;
            right: 30px;
            cursor: pointer;
            
            span {
                background-image: url('/close-menu.svg');
                background-position: cover;
                width: 100%;
                height: 100%;
                display: block;
            }
        }

        #open-menu {
            display: grid;
            position: fixed;
            z-index: 5;
            left: 0;
            height: 100%;
            width: 15vw;
            place-content: center;
            transition: left 0.4s ease-in-out;

            span {
                display: block;
                width: 10vw;
                height: 10vw;
                background: #EEE;
                border-radius: 50%;
                cursor: pointer;

                span {
                    background-image: url('/open-menu.svg');
                    background-position: cover;
                    display: block;
                    width: 100%;
                    height: 100%;
                }
            }

            &.opened {
                left: 100vw;
            }
        }

        #questions {
            margin-left: 15vw;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        }
    }
</style>