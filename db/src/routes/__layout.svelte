<script lang="ts">
    import MobileDatabaseHeader from "$lib/components/MobileDatabaseHeader.svelte";
    import DatabaseHeader from "$lib/components/DatabaseHeader.svelte";
    import { HOST_URL } from "$lib/variables";
    import { session } from '$app/stores'
    import { page } from '$app/stores'
    import { onMount } from "svelte";

    const pageToRedirect = {
        'question-search': 'question-search',
        'question': 'question-search',
        'question-submitted': 'question-search',
        'account': 'account',
        'edit': 'account',
        'write': 'write'
    }

    onMount(() => {
        console.dir($page.path)
    })
</script>
<div id="desktop-header">
    <DatabaseHeader>
        {#if $session.isLoggedIn}
            <div class="icon" style={`background-image: url(https://cdn.discordapp.com/avatars/${$session.userData.id}/${$session.userData.avatarHash}.png)`}></div>
        {:else}
            <a href={`https://discord.com/api/oauth2/authorize?client_id=895468421054083112&redirect_uri=http%3A%2F%2F${encodeURIComponent(HOST_URL)}%2Fauth%2F${pageToRedirect[$page.path.split('/')[1]]}&response_type=code&scope=identify`}>
                <button>Login</button>
            </a>
        {/if}
    </DatabaseHeader>
</div>
<div id="mobile-header">
    <MobileDatabaseHeader>
        <svelte:fragment slot="right">
            {#if $session.isLoggedIn}
                <div class="icon" style={`background-image: url(https://cdn.discordapp.com/avatars/${$session.userData.id}/${$session.userData.avatarHash}.png)`}></div>
            {:else}
                <a href={`https://discord.com/api/oauth2/authorize?client_id=895468421054083112&redirect_uri=http%3A%2F%2F${encodeURIComponent(HOST_URL)}%2Fauth%2F${pageToRedirect[$page.path.split('/')[1]]}&response_type=code&scope=identify`}>
                    <button>Login</button>
                </a>
            {/if}
        </svelte:fragment>
    </MobileDatabaseHeader>
</div>

<slot></slot>

<style lang="scss">
    .icon {
        width: 2em;
        height: 2em;
        border-radius: 50%;
        background-size: cover;
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

    #desktop-header {
        display: block;
    }

    #mobile-header {
        display: none;
    }

    @media (max-width: 600px) {
        #desktop-header {
            display: none;
        }

        #mobile-header {
            display: block;
        }
    }
</style>