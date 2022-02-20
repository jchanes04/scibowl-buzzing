<script lang="ts">
    import type { MemberData } from "$lib/classes/Member";

    export let memberList: MemberData[] = []
</script>

<div>
    <h3>Members</h3>
    <ul>
        {#each memberList as member}
            <li class:reader={member.moderator}>{member.name}</li>
        {/each}
    </ul>
</div>

<style lang="scss">
    div {
        height: 100%;
        min-height: 10em;
        max-height: 25em;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        grid-area: member-list;
        padding: 1em;
        box-sizing: border-box;
        border-radius: 1em;
        background: #EEE;

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
    
    ul {
        list-style: none;
        padding-left: 0px;
    }

    .reader {
        color: var(--orange);
    }
</style>