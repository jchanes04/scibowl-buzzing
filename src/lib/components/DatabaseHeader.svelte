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
    }
    
    h1 {
        display: inline-block;
    }
    
    #right {
        position: absolute;
        top: 1em;
        right: 1em;
    }

    button {
        color: #EEE;
        background: var(--green);
        margin: 1em;
        font-size: 20px;
        font-weight: bold;
        padding: 0.6em;
        border-radius: 0.6em;
        border: solid black 3px;
        cursor: pointer;
    }
</style>