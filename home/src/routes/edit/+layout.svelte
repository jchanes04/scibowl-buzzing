<script lang="ts">
    import Header from "$lib/components/Header.svelte";
    import { userStore } from "$lib/stores/user";
</script>

<div class="main">
    <Header loggedIn={!!$userStore}/>
    <slot></slot>
</div>

<style lang="scss">
    .main {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
        height: 100vh;
        align-content: stretch;
    }
</style>