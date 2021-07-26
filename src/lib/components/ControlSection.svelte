<script lang="ts">
    export let title: string
    export let style = ""
</script>

<div style={style}>
    <h3>{title}</h3>
    <slot></slot>
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
        background: #EEE;
    }
</style>