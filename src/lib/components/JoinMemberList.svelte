<script lang="ts">
    export let memberNames: string[] = []
</script>

<div>
    <h3>Members</h3>
    <ul>
        {#each memberNames as name}
            <li>{name}</li>
        {/each}
    </ul>
</div>

<style>
    ul {
        list-style: none;
        padding-left: 0px;
    }
</style>