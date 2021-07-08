<script lang="ts">
    import type { Member } from '$lib/classes/Member'

    export let memberList: Member[]
</script>

<div>
    <h3>Scoreboard</h3>
    <ul>
        {#each memberList as member}
            <li>{member.name + ": " + member.scoreboard.score}</li>
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
        border-top-style: solid;
        grid-area: scoreboard;
    }
    ul {
        list-style: none;
        padding-left: 0px;
    }
</style>