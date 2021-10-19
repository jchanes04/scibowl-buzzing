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
    import type {SaQuestion, McqQuestion} from 'src/mongo'
    import { session } from '$app/stores'
    import { onMount } from 'svelte';
    import { page } from '$app/stores'
    import Cookie from 'js-cookie'
    import NotLoggedIn from "$lib/components/NotLoggedIn.svelte";
    import NotAuthorized from "$lib/components/NotAuthorized.svelte";
    import DatabaseHeader from "$lib/components/DatabaseHeader.svelte";
    import { HOST_URL } from "$lib/variables";
    import EditQuestion from "$lib/components/EditQuestion.svelte";

    export let question: McqQuestion | SaQuestion

    onMount(async () => {
        let res = await fetch("/api/question/" + $page.params.id, {
            headers: {
                'Authorization': Cookie.get('authToken')
            }
        })
        question = <McqQuestion | SaQuestion>await res.json();     
    })


</script>

<svelte:head>
    <title>Edit Question</title>
</svelte:head>
<main>
    <DatabaseHeader>
        {#if $session.isLoggedIn}
            <h1 style="margin: 0;">{$session.userData?.username}</h1>
        {:else}
            <a href={`https://discord.com/api/oauth2/authorize?client_id=895468421054083112&redirect_uri=http%3A%2F%2F${encodeURIComponent(HOST_URL)}%2Fauth%2Fedit&response_type=code&scope=identify`}>
                <button>Login</button>
            </a>
        {/if}
    </DatabaseHeader>

    {#if !$session.isLoggedIn}
        <NotLoggedIn page="edit"/>
    {:else if $session.userID !== question.authorId}
        <NotAuthorized page="edit" />
    {:else}
        <div id="question-wrapper">
            <EditQuestion {question} />
        </div>
    {/if}
</main>

<style lang="scss">
    #question-wrapper {
        width: 100%;
        text-align: center;
    }

    h1 {
        font-size: 44px;
        text-decoration: underline var(--blue) 3px;
        text-underline-offset: 0.2em;
    }

    button {
        padding: 0.5em;
        color: #EEE;
        background: var(--green);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 18px;
        cursor: pointer;
        margin-top: 1em;

        &:disabled {
            padding: calc(0.5em - 3px);
            border: solid var(--green) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }
    }
</style>