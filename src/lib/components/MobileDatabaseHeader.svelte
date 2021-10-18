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
        width: calc(100% + 7px);
        z-index: 5;
        background: #d4d9d9;
    }
    
    #left {
        position: absolute;
        top: 0.75em;
        left: 0.75em;
    }
    #right {
        position: absolute;
        top: 0.75em;
        right: 0.75em;
    }
</style>