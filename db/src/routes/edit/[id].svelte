<script lang="ts" context="module">
    import type { LoadInput, LoadOutput } from '@sveltejs/kit';
    export async function load({ params, session, fetch }: LoadInput): Promise<LoadOutput> {
        if (!session.userData)
            return {
                redirect: `https://discord.com/api/oauth2/authorize?client_id=895468421054083112&redirect_uri=${encodeURIComponent(HOST_URL)}%2Fauth%2Faccount&response_type=code&scope=identify`
            }

        const res = await fetch(`/api/question/${params.id}`)
        return {
            props: {
                question: await res.json()
            }
        }
    }
</script>

<script lang="ts">
    import type {SaQuestion, McqQuestion} from '$lib/mongo'
    import { session } from '$app/stores'
    import { onMount } from 'svelte';
    import { page } from '$app/stores'
    import Cookie from 'js-cookie'
    import NotLoggedIn from "$lib/components/NotLoggedIn.svelte";
    import NotAuthorized from "$lib/components/NotAuthorized.svelte";
    import EditQuestion from "$lib/components/EditQuestion.svelte";
import { HOST_URL } from '$lib/variables';

    export let question: McqQuestion | SaQuestion

    onMount(async () => {
        const res = await fetch("/api/question/" + $page.params.id, {
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
    {#if !$session.loggedIn}
        <NotLoggedIn page="account"/>
    {:else if $session.userData.id !== question.authorId}
        <NotAuthorized page="account" />
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
</style>