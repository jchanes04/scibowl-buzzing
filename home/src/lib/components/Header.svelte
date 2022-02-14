<script lang="ts">

</script>

<div id="header">
    <h1 id="title">ESBOT</h1>
    <div id="right">
        <slot></slot>
    </div>
</div>

<style lang="scss">
    #header {
        background: var(--color-5);
        text-align: left;
        position: relative;
        overflow: hidden;
    }
    
    h1 {
        display: inline-block;
        margin-left: 0.75em;
        margin-top: 0.75em;

        @media (max-width: 800px) {
            visibility: hidden;
        }
    }
    
    #right {
        position: absolute;
        top: .57em;
        right: 1em;
        display: flex;
        flex-direction: row;
        align-items: center;
        font-size: 32px;
    }
</style>