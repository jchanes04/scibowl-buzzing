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
    ul {
        list-style: none;
        padding-left: 0px;
    }
</style>