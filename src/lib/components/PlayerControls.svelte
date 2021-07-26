<script lang="ts">
    export let buzz
    let buzzingDisabled = true

    export function enableBuzzing() {
        console.log('enable')
        buzzingDisabled = false
        setTimeout(() => {
            console.log(buzzingDisabled)
            console.log((<HTMLInputElement>document.getElementById("buzz")).disabled)
        }, 100)
    }

    export function disableBuzzing() {
        console.log('disable')
        buzzingDisabled = true
    }
</script>

<div>
    <button id="buzz" on:click={buzz} disabled={buzzingDisabled}>buzz</button>
</div>

<style>
    div {
        grid-area: control-panel;
        display: grid;
        place-content: center;
        box-sizing: border-box;
        border-radius: 1em;
        background: #EEE;
    }

    button {
        background: var(--green);
        border: 3px solid var(--blue);
        border-radius: 0.5em;
        font-size: 36px;
        font-weight: 600;
        padding: 1em 2em;
        cursor: pointer;
    }

    button:disabled {
        color: #333;
        background: var(--green-dull);
        border-color: var(--blue-dull);
        cursor: default;
    }
</style>