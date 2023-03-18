<script lang="ts">
    export let svg: string
    export let color: string = ""
</script>

<span style:color>
    {@html svg}
</span>

<style lang="scss">
    span {
        display: inline-block;
        width: 1em;
        height: 1em;
    }
</style>