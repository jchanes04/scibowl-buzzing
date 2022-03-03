<script lang='ts'>
    let helpBoxOpen :boolean 
</script>

<span id="question-box-wrapper"><span id="questionMark" on:click={()=>{helpBoxOpen=!helpBoxOpen}}>?</span>
    <div id="question-box" class:visible={helpBoxOpen}>
        <slot></slot>
    </div>
</span>

<style lang="scss">
    #question-box-wrapper{ 
        position: relative;
    }

    #question-box {
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
    *::selection {
            color: none;
            background: none;
        }
    *::-moz-selection {
        color: none;
        background: none;
    }
    #questionMark{
        padding:.2em .6em;
        background-color: var(--color-3);
        border-radius: 1em;
        color: white;
        font-size: 14px;
        font-weight: bold;
        
    }
</style>