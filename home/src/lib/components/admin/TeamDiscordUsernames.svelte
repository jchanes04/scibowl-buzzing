<script lang="ts">
    import type { Team, UserClean } from "$lib/mongo"

    export let team: Team
    export let user: UserClean | undefined
</script>

<div class="team-info">
    <h2>
        {team.name}
        {#if team.paid}
            ✔️
        {/if}
    </h2>
    {#if user}
        <p>{user.schoolName}</p>
    {/if}
    <ul>
        {#each team.members.filter(m => m.discordUsername) as member}
            <li>{member.discordUsername}</li>
        {:else}
            <li>No members</li>
        {/each}
    </ul>
</div>

<style lang="scss">
    .team-info {
        padding: 1em 2em;
        border-radius: 15px;
        background-color: var(--color-5);
    }

    ul {
        list-style: none;
    }
</style>