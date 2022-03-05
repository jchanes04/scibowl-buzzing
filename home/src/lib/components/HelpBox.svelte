<script lang='ts'>
    let helpBoxOpen: boolean
    let helpBoxElement: HTMLElement

    function handleWindowClick(e: MouseEvent) {
        if (helpBoxElement && !helpBoxElement.contains(e.target as Node)) {
            helpBoxOpen = false
        }
    }
</script>

<svelte:window on:click={handleWindowClick}></svelte:window>
<span class="question-box-wrapper" bind:this={helpBoxElement}><span class="questionMark" on:click={()=>{helpBoxOpen=!helpBoxOpen}}>?</span>
    <div class="question-box" class:visible={helpBoxOpen}>
        <slot></slot>
    </div>
</span>

<style lang="scss">
    .question-box-wrapper{ 
        position: relative;
    }

    .question-box {
        z-index: 40;
        font-size: 16px;
        font-weight: 500;
        position: absolute;
        top:1.6em;right:0em;
        background-color: white;
        padding: .5em;
        border-radius: 1em;
        width: 12em;
        display: none;
        
        &.visible {
            display: block;
            &:hover{
                display: block;
            }
        }
        
    }

    .questionMark{
        cursor: pointer;
        padding:.2em .6em;
        background-color: var(--color-3);
        border-radius: 1em;
        color: white;
        font-size: 14px;
        font-weight: bold;
        position: relative;
        bottom: 0.3em;
        user-select: none;
    }
</style>