<script lang="ts">
    export let title: string
    export let style = ""
</script>

<div style={style}>
    <h3>{title}</h3>
    <slot></slot>
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    div {
        border: 3px solid $border-color;
        border-radius: 1em;
        position: relative;
        padding: 1.5em;
        margin: 1em;
        background: $background-1;
    }

    h3 {
        margin: 0;
        padding: 0 0.5em;
        position: absolute;
        top: -0.6em;
        left: 1em;
        background: $background-1;
        border-radius: 1em;
        font-size: 0.9rem;
        font-weight: 700;
        color: $gray-2;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
</style>