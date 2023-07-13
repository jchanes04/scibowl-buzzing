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
        padding: 1em;
        box-sizing: border-box;
        border-radius: 1em;
        background: $background-1;
        min-height: 10em;
        max-height: 25em;
    }

    ul {
        @include vertical-scrollable();

        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }

    h2 {
        font-size: 26px;
        margin: 0.25em 0.5em;
    }

    h3 {
        font-size: 20px;
        font-weight: 600;
        text-decoration: underline;
        margin: 0.5em 0;
    }
    
    ul {
        list-style: none;
        padding-left: 0px;
        margin: 0;
    }
</style>