<script lang="ts">
    export let buzz
    export let buzzingDisabled: boolean
</script>

<div>
    <button id="buzz" on:click={buzz} disabled={buzzingDisabled}>buzz</button>
</div>

<style>
    div {
        grid-area: control-panel;
        border: solid black 2px;
    }

    button {
        background: hsl(145, 50%, 40%);
        border: 3px solid hsl(210, 100%, 38%);
        border-radius: 7px;
        font-size: 24px;
        font-weight: 600;
        padding: 15px 15px 15px 15px;
        cursor: pointer;
    }

    button:disabled {
        color: #333;
        background: #146737;
        border-color: #004990;
        cursor: default;
    }
</style>