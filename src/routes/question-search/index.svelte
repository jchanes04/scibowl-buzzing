<script lang="ts">
    import QuestionPreview from "$lib/components/QuestionPreview.svelte";
    import PageSwitcher from "$lib/components/PageSwitcher.svelte";
    import QueryBox from "$lib/components/QueryBox.svelte";
    import type { category } from "src/mongo";
    import type {SaQuestion, McqQuestion} from 'src/mongo'
    import Cookie from 'js-cookie'
    import {onMount, tick} from 'svelte'
    import DatabaseHeader from "$lib/components/DatabaseHeader.svelte";
    import NotLoggedIn from "$lib/components/NotLoggedIn.svelte";
    import NotAuthorized from "$lib/components/NotAuthorized.svelte";
    import { session } from '$app/stores'
    import { HOST_URL } from "$lib/variables";
import MobileDatabaseHeader from "$lib/components/MobileDatabaseHeader.svelte";

    let questions: (SaQuestion | McqQuestion)[] = []
    let pageNumber = 1
    let resultsPerPage = 20
    $: numPages = Math.ceil(questions.length / resultsPerPage)
    let menuOpen = true

    async function sendQuery(queryBox: Record<string, any>) {
        let inputs: Record<string, string> = {}
        if (queryBox.authorName) inputs.authorName = queryBox.authorName
        if (queryBox.keywords) inputs.keywords = queryBox.keywords
        if (queryBox.types.length) inputs.types = queryBox.types.join(",")
        if (queryBox.categories.length) inputs.categories = queryBox.categories.join(",")
        if (queryBox.start) inputs.start = queryBox.start
        if (queryBox.end) inputs.end = queryBox.end 
        
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
    <div id="desktop-header">
        <DatabaseHeader>
            {#if $session.isLoggedIn}
                <h1 style="margin: 0;">{$session.userData?.username}</h1>
            {:else}
                <a href={`https://discord.com/api/oauth2/authorize?client_id=895468421054083112&redirect_uri=http%3A%2F%2F${encodeURIComponent(HOST_URL)}%2Fauth%2Fquestion-search&response_type=code&scope=identify`}>
                    <button>Login</button>
                </a>
            {/if}
        </DatabaseHeader>
    </div>
    <div id="mobile-header">
        <MobileDatabaseHeader>
            <div id="open-menu" slot="left" class:opened={menuOpen} on:click={openMenu}>
                <span><span /></span>
            </div>
            <div slot="right" class="icon"></div>
        </MobileDatabaseHeader>
    </div>
    {#if !$session.isLoggedIn}
        <NotLoggedIn page="question-search" />
    {:else if !$session.userData?.username}
        <NotAuthorized page="question-search" />
    {:else}
        <div id="page">
            <div id="desktop-menu">
                <QueryBox bind:numQuestions={questions.length} on:sendQuery={(event) => {
                    sendQuery(event.detail.inputs)
                }}/>
            </div>
            <div id="mobile-menu" class:opened={menuOpen}>
                <QueryBox bind:numQuestions={questions.length} on:sendQuery={(event) => {
                    sendQuery(event.detail.inputs)
                }}/>
                <button id="close-menu" on:click={closeMenu}><span /></button>
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
    {/if}
</main>

<style lang="scss">
    #page {
        display: flex;
        flex-direction: row;
        position: relative;
    }

    #close-menu {
        display: none;
        width: 40px;
        height: 40px;
        background: var(--color-3);
        border: none;
        padding: 0;
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
        display: none;
        z-index: 5;
        left: 0;
        height: 100%;
        place-content: center;
        transition: left 0.4s ease-in-out;

        span {
            display: block;
            width: 55px;
            height: 55px;
            background: var(--color-4);
            border-radius: 10px;
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
        color: var(--color-3);
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
    
    #mobile-menu {
        width: 85vw;
        height: calc(100vh - 80px);
        display: none;
        position: fixed;
        left: -120vw;
        transition: left 0.4s ease-in-out;
        z-index: 3;
        background: #FFF;
        overflow: auto;

        &.opened {
            left: 0;
        }

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
    #mobile-header {
        display: none;
        width: 100%;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 10;
    }
    
    @media (max-width: 800px) {
        #page {
            margin-top: 80px;
        }

        #desktop-header {
            display: none;
        }
        
        #mobile-header {
            display: block;
        }

        #desktop-menu {
            display: none;
        }

        #mobile-menu {
            display: block;
        }

        #open-menu {
            display: block;
        }

        #close-menu {
            display: block;
        }

        #questions {
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        }
    }

    @media (max-width: 600px) {
        #questions {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        }
    }
</style>