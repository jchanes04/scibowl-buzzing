<script lang="ts">
</script>

<div id="header">
    <div id="left">
        <slot name="left"></slot>
    </div>
    <div id="right">
        <slot name="right"></slot>
    </div>
</div>

<style lang="scss">
    #header {
        text-align: left;
        height: 80px;
        width: min(100vw, calc(100% + 7px));
        z-index: 5;
        background: var(--color-4);
        overflow: hidden;
    }
    
    #left {
        position: absolute;
        top: 0.75em;
        left: 0.75em;
    }
    #right {
        position: absolute;
        top: 0.57em;
        right: 0.75em;
        display: flex;
        flex-direction: row;
        align-items: center;
        font-size: 32px;
    }
</style>