<script lang="ts">
    import type { Member } from "$lib/classes/Member";

    export let memberList: Member[] = []
</script>

<div>
    <h3>Members</h3>
    <ul>
        {#each memberList as member}
            <li>{member.name}</li>
        {/each}
    </ul>
</div>

<style>
    div {
        min-height: 200px;
        max-height: 400px;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        border-left-style: solid;
        border-top-style: solid;
        grid-area: member-list;
    }
    ul {
        list-style: none;
        padding-left: 0px;
    }
</style>