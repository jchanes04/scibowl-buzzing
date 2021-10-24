<script lang="ts" context="module">
    import type { LoadInput, LoadOutput } from '@sveltejs/kit';
    
    export async function load({ session, fetch }: LoadInput): Promise<LoadOutput> {
        console.dir(session)
        
        let inputs: Record<string, string> = {}
        if (session.previousQuery?.authorName) inputs.authorName = session.previousQuery.authorName
        if (session.previousQuery?.keywords) inputs.keywords = session.previousQuery.keywords
        if (session.previousQuery?.types.length) inputs.types = (session.previousQuery.types ?? []).join(",")
        if (session.previousQuery?.categories.length) inputs.categories = (session.previousQuery.categories ?? []).join(",")
        if (session.previousQuery?.start) inputs.start = session.previousQuery.start
        if (session.previousQuery?.end) inputs.end = session.previousQuery.end
        let params = new URLSearchParams(inputs)
        let questionsRes = await fetch("/api/questions?" + params.toString(), {
            headers: {
                'Authorization': Cookie.get('authToken')
            }
        })
        return {
            props: {
                questions: await questionsRes.json()
            }
        }
    }
</script>


<script lang="ts">
    import QuestionPreview from "$lib/components/QuestionPreview.svelte";
    import PageSwitcher from "$lib/components/PageSwitcher.svelte";
    import QueryBox from '$lib/components/QueryBox.svelte'
    import MobileDatabaseHeader from "$lib/components/MobileDatabaseHeader.svelte";
    import type {SaQuestion, McqQuestion} from 'src/mongo'
    import Cookie from 'js-cookie'
    import {tick} from 'svelte'
    import DatabaseHeader from "$lib/components/DatabaseHeader.svelte";
    import NotLoggedIn from "$lib/components/NotLoggedIn.svelte";
    import NotAuthorized from "$lib/components/NotAuthorized.svelte";
    import { session } from '$app/stores'
    import { HOST_URL } from "$lib/variables";

    export let questions: (SaQuestion | McqQuestion)[] = []
    let resultsPerPage = 20
    let pageNumber = Cookie.get('pageNumber') <= Math.ceil(questions.length / resultsPerPage) ? Cookie.get('pageNumber') : 1
    $: numPages = Math.ceil(questions.length / resultsPerPage)
    let menuOpen = true
    let querySent = false
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
            querySent = true
        }
    }

    function openMenu() {
        menuOpen = true
    }

    function closeMenu() {
        menuOpen = false
    }
</script>

<svelte:head>
    <title>Question Search</title>
</svelte:head>

<main>
    <div id="desktop-header">
        <DatabaseHeader>
            {#if $session.isLoggedIn}
                <h1>{$session.userData.username}</h1>
                <div class="icon" style={`background-image: url(https://cdn.discordapp.com/avatars/${$session.userData.id}/${$session.userData.avatarHash}.png)`}></div>
            {:else}
                <a href={`https://discord.com/api/oauth2/authorize?client_id=895468421054083112&redirect_uri=http%3A%2F%2F${encodeURIComponent(HOST_URL)}%2Fauth%2Fquestion-search&response_type=code&scope=identify`}>
                    <button>Login</button>
                </a>
            {/if}
        </DatabaseHeader>
    </div>
    <div id="mobile-header">
        <MobileDatabaseHeader>
            <svelte:fragment slot="left">
                {#if $session.isLoggedIn}
                    <div id="open-menu" class:opened={menuOpen} on:click={openMenu}>
                        <span><span /></span>
                    </div>
                {/if}
            </svelte:fragment>

            <svelte:fragment slot="right">
                {#if $session.isLoggedIn}
                    <h1>{$session.userData.username}</h1>
                    <div class="icon" style={`background-image: url(https://cdn.discordapp.com/avatars/${$session.userData.id}/${$session.userData.avatarHash}.png)`}></div>
                {:else}
                    <a href={`https://discord.com/api/oauth2/authorize?client_id=895468421054083112&redirect_uri=http%3A%2F%2F${encodeURIComponent(HOST_URL)}%2Fauth%2Fquestion-search&response_type=code&scope=identify`}>
                        <button>Login</button>
                    </a>
                {/if}
            </svelte:fragment>
        </MobileDatabaseHeader>
    </div>
    {#if !$session.isLoggedIn}
        <div class="spacer"></div>
        <NotLoggedIn page="question-search" />
    {:else if !$session.userData?.username}
        <div class="spacer"></div>
        <NotAuthorized page="question-search" />
    {:else}
        <div id="page">
            <div id="desktop-menu-wrapper">
                <div id="desktop-menu">
                    <QueryBox bind:numQuestions={questions.length} on:sendQuery={async (event) => {
                        await sendQuery(event.detail.inputs)
                        await tick()
                        if (event.detail.pageNumber && event.detail.pageNumber <= numPages) 
                            pageNumber = event.detail.pageNumber
                    }}/>
                </div>
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
                    <PageSwitcher
                        bind:numPages={numPages}
                        bind:pageNumber={pageNumber}
                        on:pageChange={(event) => {
                            window.scroll(0, 0)
                            Cookie.set('pageNumber', event.detail.new)
                        }}
                    />
                {:else}
                    <div id="no-results">
                        {#if querySent}
                            <h1>No Questions Found</h1>
                            <div id="bensive"></div>
                        {/if}
                    </div>
                {/if}
            </div>
            
        </div>
    {/if}
</main>

<style lang="scss">
    h1 {
        display: inline-block;
        margin: 0 1ch;
        font-size: 1em;
    }

    #page {
        display: flex;
        flex-direction: row;
        position: relative;
    }

    .icon {
        width: 1.5em;
        height: 1.5em;
        border-radius: 50%;
        background-size: cover;
    }

    .spacer {
        height: 80px;
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
        flex-grow: 1;
        width: 100%;

        @media (min-width: 800px) {
            width: 75vw;
        }
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

    #mobile-menu {
        width: 85vw;
        max-width: 50ch;
        height: calc(100vh - 80px);
        display: none;
        position: fixed;
        left: -120vw;
        transition: left 0.4s ease-in-out;
        z-index: 3;
        background: #EEE;
        overflow: auto;
        border-top-right-radius: 1em;
        border-bottom-right-radius: 1em;
        box-shadow: 25px 0px 20px #666;
        overscroll-behavior: contain;

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
            margin-top: 1.2em;
            background: transparent;
        }
        &::-webkit-scrollbar-track-piece:end {
            margin-bottom: 1.2em;
            background: transparent;
        }
    }

    #desktop-menu-wrapper {
        overflow: auto;
        height: min-content;
        max-height: calc(100vh - 50px);
        position: sticky;
        top: 20px;
        width: min(40vw, 50ch);
        flex-grow: 2;
        border-radius: 1em;
        margin-left: 1em;
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
            margin-top: 1.2em;
            background: transparent;
        }
        &::-webkit-scrollbar-track-piece:end {
            margin-bottom: 1.2em;
            background: transparent;
        }
    }

    #desktop-menu {
        background: #EEE;
        height: min-content;
        border-radius: 1em;
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
        #desktop-menu-wrapper {
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