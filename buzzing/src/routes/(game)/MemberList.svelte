<script lang="ts">
    import membersStore from "$lib/stores/players";
    import moderatorsStore from "$lib/stores/moderators";
    import myMemberStore from "$lib/stores/myMember"
    import MemberListElement from "./MemberListElement.svelte";
</script>

<div class="member-list">
    <h2>Members</h2>
    <ul>
        <h3>Moderators</h3>
        {#each Object.values($moderatorsStore) as member}
            <MemberListElement member={member.store} />
        {/each}
        <h3>Members</h3>
        {#each Object.values($membersStore) as member}
            <MemberListElement member={member.store} showControls={$myMemberStore.moderator} />
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
        border: 1px solid $border-color;
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
        margin: 0 0 1em 0;
        color: $primary;
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