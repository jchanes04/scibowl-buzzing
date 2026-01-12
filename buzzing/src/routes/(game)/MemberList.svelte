<script lang="ts">
    import { useQuery } from "convex-svelte";
    import { api } from "../../../convex/_generated/api";
    import MemberListElement from "./MemberListElement.svelte";
    import { page } from "$app/state";
    import type { ClientPlayerData } from "$lib/classes/client/ClientPlayer";
    import type { ClientModeratorData } from "$lib/classes/client/ClientModerator";
    import type { ClientTeamData } from "$lib/classes/client/ClientTeam";
    import { browser } from "$app/environment";
    
    const rawModerators = useQuery(api.moderators.getByGameId, { gameId : page.params.id ?? "" });
    const moderators : ClientModeratorData[] = $derived(
        (rawModerators.data ?? []).map(mod => ({
            name: mod.name,
            id: mod.externalId,
            connected: mod.connected,
            type: "moderator"
        }))
    );

    let memberId = $state(browser ? sessionStorage.getItem("memberId") : null);

    let showControls = $derived(moderators.some(m => m.id === memberId));

    const rawTeams = useQuery(api.teams.getByGameId, { gameId : page.params.id ?? "" });
    const teams : ClientTeamData[] = $derived(
        (rawTeams.data ?? []).map(team => ({
            id: team.externalId,
            name: team.name,
            type: team.type
        }))
    );

    const rawPlayers = useQuery(api.players.getByGameId, { gameId : page.params.id ?? "" });
    const players : ClientPlayerData[] = $derived(
        (rawPlayers.data ?? []).map(player => ({
            name: player.name,
            id: player.externalId,
            connected: player.connected,
            type: "player",
            team: teams.find(team => team.id === player.teamId)?.id ?? null,
            isCaptain: player.isCaptain ?? false
        }))
    );

</script>

<div class="member-list">
    <h2>Members</h2>
    <ul>
        <h3>Moderators</h3>
        {#each moderators as member}
            <MemberListElement member={member} />
        {/each}
        <h3>Members</h3>
        {#each players as member}
            <MemberListElement member={member} showControls={showControls} />
        {/each}
    </ul>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    .member-list {
        grid-area: member-list;
        display: grid;
        grid-template-rows: auto 1fr;
        padding: 1.5em;
        box-sizing: border-box;
        border-radius: 1em;
        background: $background-1;
        box-shadow: $shadow;
        border: 3px solid $border-color;
        min-height: 10em;
        max-height: 25em;
    }

    ul {
        @include vertical-scrollable();

        display: flex;
        flex-direction: column;
        overflow-y: auto;
        gap: 0.5em;
        list-style: none;
        padding-left: 0px;
        margin: 0;
    }

    h2 {
        font-size: 1.5rem;
        font-weight: 800;
        margin-top: 0;
        margin-bottom: 1.25rem;
        color: $text;
        border-bottom: 2px solid $gray-2;
        padding-bottom: 0.5rem;
    }

    h3 {
        font-size: 0.9rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: $gray-2;
        margin: 1em 0 0.5em 0;
        
        &:first-of-type {
            margin-top: 0;
        }
    }
</style>