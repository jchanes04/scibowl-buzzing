<script lang="ts">
    import type { PageData } from "./$types";

    export let data: PageData
    $: ({ users, teams } = data)
</script>

<main>
    <h1>{users.filter(x => !x.admin).length} Users</h1>
    <h1>{teams.length} Teams</h1>
</main>

<style lang="scss">
    h1 {
        text-align: center;
    }
</style>