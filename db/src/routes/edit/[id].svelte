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
    {#if !$session.isLoggedIn}
        <NotLoggedIn page="account"/>
    {:else if $session.userID !== question.authorId}
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