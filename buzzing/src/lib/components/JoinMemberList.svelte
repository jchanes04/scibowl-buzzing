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

<style lang="scss">
    @use '$styles/_global.scss' as *;

    div {
        margin-top: 1em;
    }

    h3 {
        font-size: 24px;
        text-decoration: underline $blue 2px;
        text-underline-offset: 0.1em;
        margin-bottom: 0.5em;
    }

    ul {
        list-style: none;
        padding-left: 0px;
    }

    li {
        font-size: 18px;
        margin: 0.4em 0;
    }
</style>