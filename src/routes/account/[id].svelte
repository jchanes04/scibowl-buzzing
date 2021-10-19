<script lang="ts" context="module">
    import type { LoadInput, LoadOutput } from '@sveltejs/kit';
    export async function load({ page, fetch }: LoadInput): Promise<LoadOutput> {
        const res = await fetch(`/api/user/${page.params.id}`)
        return {
            props: {
                userData: await res.json()
            }
        }
    }
</script>

<script lang="ts">
    import { session } from '$app/stores'
    import NotLoggedIn from "$lib/components/NotLoggedIn.svelte";
    import NotAuthorized from "$lib/components/NotAuthorized.svelte";
    import DatabaseHeader from '$lib/components/DatabaseHeader.svelte';
    import Account from '$lib/components/Account.svelte'
    import { HOST_URL } from "$lib/variables";

    export let userData
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
    {:else if $session.userID}
        <NotAuthorized page="account" />
    {:else}
        <div id="account">
            <Account {userData}/>
        </div>
    {/if}
</main>

<style lang="scss">
    
</style>