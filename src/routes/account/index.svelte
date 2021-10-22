<script lang="ts" context="module">
    import type { LoadInput, LoadOutput } from '@sveltejs/kit';
    
    export async function load({ page, fetch, session }: LoadInput): Promise<LoadOutput> {
        const userRes = await fetch(`/api/user/${session.userID}`)
        const userSettingsRes = await fetch(`/api/user/${session.userID}/settings`)
        const questionsRes = await fetch(`/api/questions?authorId=${session.userID}`)
        return {
            props: {
                userData: await userRes.json(),
                userSettings: await userSettingsRes.json(),
                questions: await questionsRes.json()
            }
        }
    }

</script>

<script lang="ts">
    import { session } from '$app/stores'
    import QuestionPreview from '$lib/components/QuestionPreview.svelte';
    import NotLoggedIn from "$lib/components/NotLoggedIn.svelte";
    import NotAuthorized from "$lib/components/NotAuthorized.svelte";
    import DatabaseHeader from '$lib/components/DatabaseHeader.svelte';
    import Account from '$lib/components/Account.svelte'
    import AccountEdit from '$lib/components/AccountEdit.svelte'
    import { HOST_URL } from "$lib/variables";
    import type { McqQuestion, SaQuestion, User, UserSettings } from 'src/mongo';
    export let questions: (SaQuestion|McqQuestion)[]
    export let userData: User
    export let userSettings: UserSettings
</script>

<main>
    <DatabaseHeader>
        {#if $session.isLoggedIn}
            <h1 style="margin: 0;">{$session.userData?.username}</h1>
        {:else}
            <a href={`https://discord.com/api/oauth2/authorize?client_id=895468421054083112&redirect_uri=http%3A%2F%2F${encodeURIComponent(HOST_URL)}%2Fauth%2Faccount&response_type=code&scope=identify`}>
                <button>Login</button>
            </a>
        {/if}
    </DatabaseHeader>
    {#if !$session.isLoggedIn}
        <NotLoggedIn page="account"/>
    {:else if !$session.userID}
        <NotAuthorized page="account" />
    {:else}
    
        <div id="account">
            <AccountEdit {userData} {userSettings} {questions} />
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