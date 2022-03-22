<script lang="ts">
    import gameInfoStore from "$lib/stores/gameInfo";
    import membersStore from "$lib/stores/members";
    import moderatorStore from "$lib/stores/moderators";
    import MemberListElement from "./MemberListElement.svelte";
</script>

<div class="member-list">
    <h2>Members</h2>
    <ul>
        <h3>Moderators</h3>
        {#each $moderatorStore as member}
            <MemberListElement {member} />
        {/each}
        <h3>Members</h3>
        {#each $membersStore as member}
            <MemberListElement {member} showControls={$gameInfoStore.myMember.moderator} />
        {/each}
    </ul>
</div>

<style lang="scss">
    .member-list {
        grid-area: member-list;
        display: grid;
        grid-template-rows: auto 1fr;
        padding: 1em;
        box-sizing: border-box;
        border-radius: 1em;
        background: #EEE;
        min-height: 10em;
        max-height: 25em;
    }

    ul {
        display: flex;
        flex-direction: column;
        overflow-y: auto;

        &::-webkit-scrollbar {
            width: 5px;
        }

        &::-webkit-scrollbar-button {
            display: none;
        }

        &::-webkit-scrollbar-track {
            background: transparent;
        }

        &::-webkit-scrollbar-thumb {
            background: var(--green);
            width: 5px;
            border-radius: 5px;
        }

        &::-webkit-scrollbar-track-piece:start {
            margin-top: 1.2em;
            background: transparent;
        }

        &::-webkit-scrollbar-track-piece:end {
            margin-bottom: 1.2em;
            background: transparent;
        }
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