<script lang="ts">
    interface Props {
        title: string;
        style?: string;
        children?: import("svelte").Snippet;
    }

    let { title, style = "", children }: Props = $props();
</script>

<div {style}>
    <h3>{title}</h3>
    {@render children?.()}
</div>

<style lang="scss">
    div {
        border: solid #333 2px;
        border-radius: 1em;
        position: relative;
        padding: 1em;
        margin: 1em;
    }

    h3 {
        margin: 0;
        padding: 0 0.3em;
        position: absolute;
        top: -0.6em;
        left: 1em;
        background: #eee;
    }
</style>
