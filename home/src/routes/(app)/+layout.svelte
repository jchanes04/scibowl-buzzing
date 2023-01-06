<script lang="ts">
    import Header from "$lib/components/Header.svelte";
</script>

<Header loggedIn={$session.loggedIn}/>
<slot></slot>