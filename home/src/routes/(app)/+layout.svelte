<script lang="ts">
    import Header from "$lib/components/Header.svelte";
    import { userStore } from "$lib/stores/user";
</script>

<Header loggedIn={!!$userStore}/>
<slot></slot>