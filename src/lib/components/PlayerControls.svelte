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
        border-left: solid 2px;
        border-right: solid 2px;
        border-bottom: solid 2px;
        border-top: solid 1px;
        box-sizing: border-box;
    }

    button {
        background: var(--green);
        border: 3px solid var(--blue);
        border-radius: 7px;
        font-size: 24px;
        font-weight: 600;
        padding: 15px 15px 15px 15px;
        cursor: pointer;
    }

    button:disabled {
        color: #333;
        background: var(--green-dull);
        border-color: var(--blue-dull);
        cursor: default;
    }
</style>