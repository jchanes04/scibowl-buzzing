<script lang="ts">
    import Header from "$lib/components/Header.svelte";
    import { session } from '$app/stores'
</script>

<Header loggedIn={$session.loggedIn}/>
<slot></slot>