<script lang="ts">

</script>

<div id="header">
    <h1>Enloe Scibowl Question Database</h1>
    <div id="right">
        <slot></slot>
    </div>
</div>

<style lang="scss">
    #header {
        text-align: left;
        position: relative;
        overflow: hidden;
    }
    
    h1 {
        display: inline-block;
    }
    
    #right {
        position: absolute;
        top: 1em;
        right: 1em;
    }
</style>