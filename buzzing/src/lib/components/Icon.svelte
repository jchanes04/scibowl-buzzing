<script lang="ts">
    interface Props {
        svg: string;
        color?: string;
    }

    let { svg, color = "" }: Props = $props();
</script>

<span style:color>
    {@html svg}
</span>

<style lang="scss">
    span {
        display: inline-block;
        width: 1em;
        height: 1em;

        :global(svg) {
            width: 100%;
            height: 100%;
        }
    }
</style>
