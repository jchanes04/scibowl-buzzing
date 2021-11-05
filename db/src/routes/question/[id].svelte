<script lang="ts" context="module">
    import type { LoadInput, LoadOutput } from '@sveltejs/kit';
    export async function load({ page, fetch }: LoadInput): Promise<LoadOutput> {
        const res = await fetch(`/api/question/${page.params.id}`)
        return {
            props: {
                question: await res.json()
            }
        }
    }
</script>

<script lang="ts">
    import { page, session } from '$app/stores'
    import type { category } from 'src/mongo';
    import { onMount } from 'svelte';
    import type {SaQuestion, McqQuestion} from 'src/mongo'
    import Question from '$lib/components/Question.svelte';
    import Cookie from 'js-cookie'
    import NotLoggedIn from "$lib/components/NotLoggedIn.svelte";
    import NotAuthorized from "$lib/components/NotAuthorized.svelte";
    import { HOST_URL } from '$lib/variables';
    import DatabaseHeader from '$lib/components/DatabaseHeader.svelte'
    import MobileDatabaseHeader from '$lib/components/MobileDatabaseHeader.svelte'
import QueryBox from '$lib/components/QueryBox.svelte';
    export let question: SaQuestion | McqQuestion
    let menuOpen :boolean = false
    let answerVisible = false
    let loaded = true
    let noMatch = false
    let questionsSeen: string [] = []
    let author: string
    let types: ("MCQ" | "SA")[] = []
    let categories: category[] = []
    let start,end

    onMount(async () => {
        let stored = JSON.parse(Cookie.get('lastQuery') || "{}")
        author = stored.author
        types = !stored.types ? [] : stored.types
        categories = !stored.categories ? [] : stored.categories
        start = stored.start ? stored.start : undefined
        end = stored.end ? stored.end : undefined
    })

    async function sendQuery(inputs: Record<string, string>) {
        answerVisible = false
        let params = new URLSearchParams(inputs)
        let res = await fetch("/api/random?" + params.toString())
        let returnedQuestion = await res.json()
        if (returnedQuestion.error) {
            noMatch = true
        } else {
            noMatch = false
            question = returnedQuestion
            questionsSeen.push(question.id)
            history.pushState(null, '', '/question/' + question.id)
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
    <title>View Question</title>
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
        <NotLoggedIn page="question-search" />
    {:else if !$session.userData?.username}
        <NotAuthorized page="question-search" />
    {:else}
        <div id="page">
            <div id="desktop-menu-wrapper">
                <div id="desktop-menu">
                    <QueryBox numQuestions={0} on:sendQuery={async (event) => {
                        sendQuery(event.detail.inputs)
                    }}/>
                </div>
            </div>
            <div id="mobile-menu" class:opened={menuOpen}>
                <QueryBox numQuestions={0} on:sendQuery={(event) => {
                    sendQuery(event.detail.inputs)
                }}/>
                <button id="close-menu" on:click={closeMenu}><span /></button>
            </div>
            {#if noMatch}
                <h1>No questions matched that query</h1>
            {:else if loaded}
                <Question {question} bind:answerVisible={answerVisible} />
            {:else}
                <h1>Loading...</h1>
            {/if}
        </div>
    {/if}
</main>

<style lang="scss">
    #page {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
    }

    .icon {
        width: 1.5em;
        height: 1.5em;
        border-radius: 50%;
        background-size: cover;
    }

    h1 {
        display: inline-block;
        margin: 0 1ch;
        font-size: 1em;
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
            background: var(--color-2);
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
        max-width: 350px;
        flex-grow: 2;
        border-radius: 1em;
        margin-left: 1em;
        margin-top: 1.2em;
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
            background: var(--color-2);
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
        background: var(--color-6);
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
    
    button {
        color: #EEE;
        background: var(--color-2);
        font-size: 20px;
        font-weight: bold;
        padding: 0.6em;
        border-radius: 0.6em;
        border: solid black 3px;
        cursor: pointer;
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
    }
</style>