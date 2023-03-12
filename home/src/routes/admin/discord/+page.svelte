<script lang="ts">
    import TeamDiscordUsernames from "$lib/components/admin/TeamDiscordUsernames.svelte";
    import type { PageData } from "../$types";

    export let data: PageData
    $: ({ users, teams } = data)
</script>

<main>
    <h1>{teams.length} Teams</h1>
    <div class="teams">
        {#each teams as team}
            <TeamDiscordUsernames {team} user={users.find(x => x._id === team.userId)} />
        {/each}
    </div>
</main>

<style lang="scss">
    main {
        position: relative;
        padding: 1em;
    }

    h1 {
        text-align: center;
    }

    .teams {
        display: flex;
        flex-direction: column;
        gap: 1em;
        margin: 1em auto;
        padding: 3em;
        max-width: 800px;
    }
</style>