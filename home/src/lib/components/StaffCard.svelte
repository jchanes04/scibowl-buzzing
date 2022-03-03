<script lang="ts">
    export let name: string
    export let grade: string
    export let categories: string
</script>


<div>
    <h2>{name}</h2>
    <h3>{grade}</h3>
    <h3>{categories}</h3>
    <p><slot></slot></p>
</div>


<style lang="scss">
    div {
        background-color: var(--color-6);
        border-radius: 1em;
        padding: 1em;
        margin: .5em;
        display:inline-block;
        flex-basis: 300px;
    }
    p{
        margin:auto;
    }
    h2 {
        color: var(--color-3);
        margin:auto;
    }
    h3 {
        margin: auto;
    }
</style>