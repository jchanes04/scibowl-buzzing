<script lang="ts">
import warnStore from "$lib/stores/Warn";    
</script>


<div>
    <h1>Warning!</h1><br />
    {#each $warnStore.message as message}
        <p>{message}</p><br />
    {/each}
    
    <button on:click={()=>{$warnStore.state='accept'}}>Accept</button>
    <button on:click={()=>{$warnStore.state='decline'}}>Cancel</button>
</div>

<style lang="scss">
    h1{
        margin: 1em, auto, 0em, auto;
        display:inline-block;
    }
    p {
        margin: 0em;
    }
    div {
        padding: 2em;
        z-index: 999;
        text-align: center;
        position:fixed;
        display: block;
        top:50%;
        left: 50%;
        transform: translate(-50%,-50%);
        min-height:12em;
        border: .2em solid black;
        border-radius: 1em;
        background-color: var(--color-5);
    }
    
    button {
        display:inline-block;
        padding: 0.5em;
        margin: .5em;
        color: #EEE;
        background: var(--color-2);
        border-radius: 0.3em;
        font-weight: bold;
        border: solid black 3px;
        font-size: 18px;
        cursor: pointer;
        width: 15ch;

        &:disabled {
            border: solid var(--color-2) 3px;
            background: transparent;
            color: #444;
            cursor: default;
        }
    }

</style>
