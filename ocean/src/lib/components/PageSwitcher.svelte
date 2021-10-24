<script lang="ts">
    import { createEventDispatcher } from "svelte";
    export let numPages : number 
    export let pageNumber : number 
    $: inputValue = pageNumber.toString()
    let previousInput = pageNumber.toString()

    let inputElement

    const dispatch = createEventDispatcher()

    async function handleChange() {
        if (parseInt(inputValue)>numPages || parseInt(inputValue)<1) {
            inputValue=pageNumber.toString()
        } else {
            inputValue = parseInt(inputValue).toString()
            previousInput = parseInt(inputValue).toString()
        }

        dispatch('pageChange', {
            old: pageNumber,
            new: parseInt(inputValue)
        })
        pageNumber = parseInt(inputValue)
        inputElement.blur()
    }
    
    
    function handleInput() {
        if (isNaN(parseInt(inputValue)) && inputValue !== "") {
            inputValue = previousInput
        } else {
            previousInput = inputValue
        }
    }
</script>
    
<div>
    <button on:click={() => {if(pageNumber>1){
        dispatch('pageChange', {
            old: pageNumber,
            new: pageNumber - 1
        })
        pageNumber -= 1
    }}}
    disabled={pageNumber === 1}>
        <span />
    </button>
    <input type="text" bind:this={inputElement} bind:value={inputValue} on:input={handleInput} on:change={handleChange}/>
    <button on:click={() => {if(pageNumber<numPages){
        dispatch('pageChange', {
            old: pageNumber,
            new: pageNumber + 1
        })
        pageNumber += 1        
    }}}
    disabled={pageNumber === numPages}>
        <span style="transform: scaleX(-1)" />
    </button>
</div>

<style lang="scss">
    div {
        margin-top: 1em;
        text-align: center;
        font-size: 20px;
    }

    input[type="text"] {
        padding: 0.3em;
        margin: 0em 0.7em;
        border: none;
        border-radius: 0.3em;
        font-size: inherit;
        box-sizing: border-box;
        text-align: center;
        font-family: 'Ubuntu';
        position: relative;
        vertical-align: middle;
        width: 5ch;

        &:focus::placeholder {
            color: transparent;
        }
    }
    
    button {
        background: #EEE;
        border-radius: 50%;
        font-size: inherit;
        outline: none;
        border: none;
        width: 1.7em;
        height: 1.7em;
        padding: 0.2em;
        vertical-align: middle;
        cursor: pointer;

        span {
            background-image: url('/arrow.svg');
            background-size: cover;
            width: 100%;
            height: 100%;
            display: block;
        }

        &:disabled {
            cursor: default;
        }
    }
</style>