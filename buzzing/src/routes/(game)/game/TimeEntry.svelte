<script lang="ts">
    import { tick } from "svelte";
    
    export let value = 0
    $: minutesString = Math.floor(value / 60).toString().padStart(2, "0")
    $: secondsString = (value % 60).toString().padStart(2, "0")
    $: minutes = Number(minutesString) || 0
    $: seconds = Number(secondsString) || 0
    
    function updateValue() {
        value = seconds + minutes * 60
    }

    async function handleMinuteInput() {
        await tick()
        updateValue()
        if (minutesString.length >= 2) {
            minutesInput.blur()
            secondsInput.focus()
        }
    }

    let minutesInput: HTMLInputElement
    let secondsInput: HTMLInputElement
</script>

<div>
    <input type="text" bind:this={minutesInput} bind:value={minutesString}
        on:focus={() => minutesString = ""} on:input={handleMinuteInput} />
    <span>:</span>
    <input type="text" bind:this={secondsInput} bind:value={secondsString}
        on:focus={async () => {await tick(); secondsString = ""}} on:change={updateValue} />
</div>

<style lang="scss">
    @use '$styles/_global.scss' as *;

    div {
        background: $background-1;
        border-radius: 0.3em;
        font-size: 30px;
        font-weight: 600;
        display: inline-block;
    }

    input {
        border: none;
        width: 2ch;
        font-size: inherit;
        border-radius: 0.3em;
        padding: 0.3em;
        background: transparent;
        color: inherit;
    }
</style>