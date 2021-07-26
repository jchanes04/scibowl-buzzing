<script lang="ts">
    import type { MemberClean } from "$lib/classes/Member";

    export let memberList: MemberClean[] = []
</script>

<div>
    <h3>Members</h3>
    <ul>
        {#each memberList as member}
            <li class={member.reader ? "reader" : ""}>{member.name}</li>
        {/each}
    </ul>
</div>

<style lang="scss">
    div {
        height: 100%;
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
        color: orange;
    }
</style>