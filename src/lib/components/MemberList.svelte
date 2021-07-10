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

<style>
    div {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        border-left: solid 2px;
        border-top: solid 2px;
        border-right: solid 1px;
        border-bottom: solid 1px;
        grid-area: member-list;
        box-sizing: border-box;
        padding: 1em;
    }
    ul {
        list-style: none;
        padding-left: 0px;
    }

    .reader {
        color: orange;
    }
</style>