<script lang="ts">
    let displayTab: string = 'bio'
</script>


<div class="subject-menu">
    <div class="tab" class:active={displayTab=='bio'} on:click={() => displayTab='bio'}><p>Biology</p></div>
    <div class="tab" class:active={displayTab=='chem'} on:click={() => displayTab='chem'}><p>Chemistry</p></div>
    <div class="tab" class:active={displayTab=='physics'} on:click={() => displayTab='physics'}><p>Physics</p></div>
    <div class="tab" class:active={displayTab=='earth'} on:click={() => displayTab='earth'}><p>Earth And Space</p></div>
    <div class="tab" class:active={displayTab=='math'} on:click={() => displayTab='math'}><p>Math</p></div>
</div>
<div class="subject-tabs">
    {#if displayTab=='bio'}
        <div class='displayedTab'><slot name="bio" /></div>
    {:else if displayTab=='chem'}
        <div class='displayedTab'><slot name="chem" /></div>
    {:else if displayTab=='physics'}
        <div class='displayedTab'><slot name="physics" /></div>
    {:else if displayTab=='earth'}
        <div class='displayedTab'><slot name="earth" /></div>
    {:else if displayTab=='math'}
        <div class='displayedTab'><slot name="math" /></div>
    {/if}
</div>


<style lang='scss'>
    p {
        padding: 0;
        margin: 0;
    }
    .subject-menu {
        display: flex;
        gap: 2px;
        flex-direction: row;
        align-items: end;
        height: 2.7em;
        margin-bottom: 0px;
        overflow-x: auto;
        overflow-y: hidden;
        
        &::-webkit-scrollbar-thumb {
            height: 1px; 
        }
    }
    
    *::-webkit-scrollbar {
        height: 4px;
    }
    * {
        scrollbar-width: thin;
    }
    *::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.4);
        border-radius: 2px;
        height: 4px;
        border: 0px solid rgba(0, 0, 0, 0);
        background-clip: padding-box;
    }

    *::-webkit-scrollbar-corner {
        display: none;
    }

    .tab {
        border-radius: .6em .2em 0em 0em;
        background-color: var(--color-6);
        color: white;
        padding:.12em 1em;
        cursor: pointer;

        p {
            overflow: hidden;
            white-space: nowrap;
        }
    }

    .tab.active{
        color: black;
        background-color: var(--color-3);
        padding-bottom: 0.2em;
        padding-top: 0.2em;
        transition: padding 0.1s ease-out;
    }

    .tab:not(.active) {
        margin-bottom: 1px;
    }

    .displayedTab{
        color: black;
        padding: 1em;
        border-radius: 0 .5em .5em .5em;
        background-color: var(--color-3);
    }
    
</style>