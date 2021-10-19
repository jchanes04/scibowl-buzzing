<script lang="ts">
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
    
</main>