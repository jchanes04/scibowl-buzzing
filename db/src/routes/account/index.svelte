<script lang="ts" context="module">
    import type { LoadInput, LoadOutput } from '@sveltejs/kit';
    
    export async function load({ fetch, session }: LoadInput): Promise<LoadOutput> {
        if (!session.userData)
            return {
                redirect: `https://discord.com/api/oauth2/authorize?client_id=895468421054083112&redirect_uri=${encodeURIComponent(HOST_URL)}%2Fauth%2Faccount&response_type=code&scope=identify`,
                status: 302
            }

        const userRes = await fetch(`/api/user/${session.userData.id}`)
        const userSettingsRes = await fetch(`/api/user/${session.userData.id}/settings`)
        const questionsRes = await fetch(`/api/questions?authorId=${session.userData.id}`)
        const questions = await questionsRes.json()
        return {
            props: {
                userData: await userRes.json(),
                userSettings: await userSettingsRes.json(),
                questions
            }
        }
    }
</script>

<script lang="ts">
    import { session } from '$app/stores'
    import QuestionPreview from '$lib/components/QuestionPreview.svelte';
    import NotLoggedIn from "$lib/components/NotLoggedIn.svelte";
    import NotAuthorized from "$lib/components/NotAuthorized.svelte";
    import AccountEdit from '$lib/components/AccountEdit.svelte'
    import type { McqQuestion, SaQuestion, User, UserSettings } from '$lib/mongo';
import { HOST_URL } from '$lib/variables';
    export let questions: (SaQuestion|McqQuestion)[]
    export let userData: User
    export let userSettings: UserSettings
</script>

<svelte:head>
    <title>Your Account</title>
</svelte:head>

<main>
    {#if !$session.loggedIn}
        <NotLoggedIn page="account"/>
    {:else if !$session.userData}
        <NotAuthorized page="account" />
    {:else}
        <div id="account">
            <AccountEdit
                bind:userData={userData}
                bind:userSettings={userSettings}
                bind:questions={questions}
            />
        </div>
    
        <div id="questions-wrapper">
            <div id="questions">
                {#if questions}
                    {#each questions as question}
                        <QuestionPreview question={question}/>
                    {/each}
                {/if} 
            </div>
        </div>
    {/if}
</main>

<style lang="scss">
    #account{
        margin-top: 1.2em;
    }
    #questions-wrapper {
        width: 100%;
        display: grid;
        place-content: center;
    }

    #questions {
        margin: auto;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        row-gap: 20px;
        column-gap: 20px;
        margin: 5em;
        width: 90vw;
        max-width: 1400px;
    }
</style>