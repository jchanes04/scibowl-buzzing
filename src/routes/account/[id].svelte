<script (lang="ts")>
    import { session } from '$app/stores'
    import { onMount } from 'svelte';
    import { page } from '$app/stores'
    import NotLoggedIn from "$lib/components/NotLoggedIn.svelte";
    import NotAuthorized from "$lib/components/NotAuthorized.svelte";
    import DatabaseHeader from '$lib/components/DatabaseHeader.svelte';
    import Account from '$lib/components/Account.svelte'
    import { HOST_URL } from "$lib/variables";
    import Cookie from 'js-cookie'
</script>

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
    <!-- {#if !$session.isLoggedIn}
        <NotLoggedIn page="edit"/>
    {:else if $session.userID}
        <NotAuthorized page="edit" />
    {:else} 
    {/if}-->
    <div id="account">
        <Account id={$page.params.id}/>
    </div>
</main>

<style lang="scss">
    
</style>